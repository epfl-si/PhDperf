import {Meteor} from 'meteor/meteor'
import {MongoInternals} from "meteor/mongo"
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus"
import {Metrics} from '/server/prometheus'
import {decrypt, encrypt} from "/server/encryption"
import debug_ from 'debug'
import {
  Duration,
  Job,
  IOutputVariables,
  JobCompletionInterface,
  PublishMessageRequest
} from "zeebe-node"
import {
  Task,
  Tasks
} from "/imports/model/tasks"
import {PhDInputVariables} from "/imports/model/tasksTypes";
import {auditLogConsoleOut} from "/imports/lib/logging";
import {PhDCustomHeaderShape} from "phd-assess-meta/types/fillForm/headers";
import {NotificationLog, NotificationStartMessage} from "phd-assess-meta/types/notification";
import {PhDAssessVariables} from "phd-assess-meta/types/variables";
import {normalizeTaskActivityLogsForStartedEvent} from "/server/methods/Activity";

const debug = debug_('phd-assess:zeebe-connector')
const auditLog = auditLogConsoleOut.extend('server/zeebe_broker_connector')


// what is sent as result
// should be the whole form, or an ACL decided value
interface OutputVariables {
  [key: string]: any
}

// redeclare what is a job in the PhD context
export interface PhDZeebeJob<WorkerInputVariables = PhDInputVariables, CustomHeaderShape = PhDCustomHeaderShape, WorkerOutputVariables = IOutputVariables> extends Job<WorkerInputVariables, CustomHeaderShape>, JobCompletionInterface<WorkerOutputVariables> {
}

// list which variables are not encrypted.
const alreadyDecryptedVariables = [
  'dashboardDefinition',
  'uuid',
  'notifySubject',
  'notifyMessage',
]

export let zBClient: ZeebeSpreadingClient | null = null

function zeebeJobToTask(job: PhDZeebeJob): Task {
  // decrypt the variables before saving into memory
  const decryptedVariables: any = {}
  let undecryptableVariablesKey: string[] = []

  Object.keys(job.variables).map((key) => {
    try {
      if ( alreadyDecryptedVariables.includes(key) ) {
        decryptedVariables[key] = job.variables[key]
      } else if ( Array.isArray(job.variables[key]) ) {
        decryptedVariables[key] = job.variables[key].reduce(
          (acc: ( string | null )[], item: string | null) => {
            // forget null values, it provides nothing in our current setup
            if (item != null) {
              const decryptedItem = decrypt(item)
              acc.push(decryptedItem)
            }
            return acc
        }, [])
      } else {
        const decryptedItem = decrypt(job.variables[key])
        // forget null values, it provides nothing in our current setup
        if (decryptedItem != null) decryptedVariables[key] = decryptedItem
      }
    } catch (error) {
      undecryptableVariablesKey.push(key)
    }
  })

  if (undecryptableVariablesKey.length > 0) {
    // not good, some values are not readable.
    const cantDecryptError = new Error(`Error: Some fields are undecryptable. Fields : ${JSON.stringify(undecryptableVariablesKey)}`)
    debug(`Can't decrypt one or more key: ${JSON.stringify(undecryptableVariablesKey)}`)
    throw cantDecryptError
  }

  // manage the special case of assignees scipers. They can come, historically, as a variable or as field designator
  // the field designator is the moderne way to get the flexibility to refresh a job when a participant has been changed
  if (job.customHeaders.assigneeSciperFieldName) {
    const fieldsName = []
    const scipers: string[] = []

    if (job.customHeaders.assigneeSciperFieldName.includes(',')) {
      job.customHeaders.assigneeSciperFieldName.split(',').forEach(f => fieldsName.push(f?.trim()))
    } else {
      fieldsName.push(job.customHeaders.assigneeSciperFieldName.trim())
    }

    // get the value for each field
    fieldsName.forEach(field =>
      decryptedVariables[field] && scipers.push(decryptedVariables[field])
    )

    decryptedVariables.assigneeSciper = scipers
  }

  // we are ok to make it to a task now
  const task = job as unknown as Task
  task._id = job.key
  task.variables = decryptedVariables as PhDInputVariables

  return task
}

enum PersistOutcome {
  NEW = 1,
  ALREADY_KNOWN = 2,
  ALREADY_SUBMITTED = 3,
}

/**
 * Save `job` into `to_collection`.
 *
 * 💡 A return value of `PersistOutcome.ALREADY_KNOWN` occurs quite a
 * lot, since Zeebe's entire architecture basically believes that all
 * jobs should be performed promptly, whereas we are asking humans to
 * fill out forms.
 *
 * This is a Fiber'd function i.e. it may perform async work
 * “transparently” (without using async / await)
 *
 * @returns `PersistOutcome.NEW` if we see this job for the very first time
 * @returns `PersistOutcome.ALREADY_KNOWN` if we already had this job in store
 * @returns `PersistOutcome.ALREADY_SUBMITTED` if the job is new but was marked as submitted. It can happen
 *           if we are pulling some batch data that takes time while the job is being submitted
 */
function persistJob (job: PhDZeebeJob) : PersistOutcome {
  let status : PersistOutcome

  // assert before inserting that this task is not already submitted
  if (Tasks.find({ _id: job.key, 'journal.submittedAt': { $exists:true } }).count() !== 0) {
    auditLog(`Refusing to add this task ( job key: ${job.key}, process instance : ${job.processInstanceKey} ) to meteor, as it was flagged as already submitted`)
    return PersistOutcome.ALREADY_SUBMITTED
  }

  const task = zeebeJobToTask(job)
  const taskExistAlready = ( Tasks.find({ _id: job.key }).count() !== 0 )
  let taskId: string;  // keep a log of the created/updated id

  if ( !taskExistAlready ) {
    // a new task, insert all data, with journaling set
    taskId = Tasks.insert({
        ...{
          journal: {
            lastSeen: new Date(),
            seenCount: 1
        }},
        ...task
      } as Task
    )
  } else {
    // updating the existing for the up-to-date values
    Tasks.update(job.key, {
      $inc: { "journal.seenCount": 1 },
      $set: {
        "journal.lastSeen": new Date(),
        "variables.notificationLogs": task.variables.notificationLogs,
        "variables.activityLogs": task.variables.activityLogs,
      },
    })
    taskId = job.key
  }

  if ( !taskExistAlready ) {
    debug(`Received a new job from Zeebe ${ taskId }`)
    status = PersistOutcome.NEW
  } else {
    status = PersistOutcome.ALREADY_KNOWN
  }

  // assert the started activity is correctly set or set it
  normalizeTaskActivityLogsForStartedEvent(task.key)

  return status
}

const pollInterval = Meteor.isDevelopment ? Duration.seconds.of(10) : Duration.seconds.of(1)

export default {
  start() {
    const taskType = 'phdAssessFillForm'

    zBClient = new ZeebeSpreadingClient()

    debug(`creating Zeebe worker of type "${taskType}"...`);
    zBClient.createWorker({
      taskType: taskType,
      // Here you have to find the balance between getting to many data for a pipe and not enough tasks
      // for a full cycle of activating->activated->reactivating
      maxJobsToActivate: process.env.ZEEBE_WORKER_MAX_JOBS_TO_ACTIVATE ?? 500,
      // Set timeout, the same as we will ask yourself if the job is still up
      timeout: process.env.ZEEBE_WORKER_TIMEOUT ?? Duration.seconds.of(20),
      pollInterval: pollInterval,
      // load every job into the in-memory server db
      taskHandler:
        Meteor.bindEnvironment(      // therefore, Fiber'd
          (job: PhDZeebeJob,
          ) => {
            Metrics.zeebe.received.inc()
            let outcome: PersistOutcome

            try {
              outcome = persistJob(job)
            } catch (error) {
              if (error instanceof MongoInternals.NpmModules.mongodb.module.MongoNetworkError
              ) {
                // retry later, Mongo may not be available at that time
                return job.forward()
              } else {
                // unable to create the task or a variable is failing to be decrypted => no good at all
                // we can't do better than alerting the logs
                debug(`Unable to decrypt or persist Zeebe job (${job.key}). Sending a task fail to the broker. Task process id : ${job.processInstanceKey}. ${error}.`)
                Metrics.zeebe.errors.inc()
                // raise the issue to Zeebe
                return job.fail(`Unable to decrypt some values or to mirror to Mongo, failing the job. ${error}.`, 0)
              }
            }

            if (outcome === PersistOutcome.NEW) {
              Metrics.zeebe.inserted.inc()

              this.replyWithReceipt(job).then( ()=> {} )
            }

            // as we had no error, tell Zeebe that we'll think about it, and free ourselves to receive more work
            return job.forward()
          })
    })
    debug(`Zeebe worker "${taskType}" created`);
  },

  async success(key: string, workerResult: OutputVariables) {
    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `The task ${key} can not be closed if zeebe is not connected.`);
    }

    await zBClient?.completeJob({
      jobKey: key,
      variables: workerResult,
    })
    debug(`Worker ${key} sent complete and successful status to Zeebe`)
    Metrics.zeebe.successes.inc();
  },

  async fail(task: Task, retry: number, message: string) {
    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `The job can not be set to fail if zeebe is not connected`);
    }

    await zBClient.failJob( {
      jobKey: task.key,
      retries: retry,
      errorMessage: message,
      retryBackOff: 4 // should be optional, but as it is not, set it to default, 4ms
    })

    debug(`Manually failed the job id ${task.key}`)
  },

  async setVariables(
    elementInstanceKey: string,
    variables: Partial<PhDAssessVariables>,
    local: boolean
  ) {
    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `No variables can be sent if zeebe is not connected.`);
    }

    auditLog(`Calling setVariables on elementInstanceKey ${elementInstanceKey} with variables ${ JSON.stringify(variables) }`)

    await zBClient.setVariables({
      variables: variables,
      elementInstanceKey: elementInstanceKey,
      local: local
    })
  },

  async publishMessage(params: PublishMessageRequest) {
    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `No message can be sent if zeebe is not connected.`);
    }

    return await zBClient.publishMessage(params)
  },

  async setTaskToActivateToANewJob(task: Task) {
    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `No task can be activated if zeebe is not connected.`);
    }

    return await zBClient.modifyProcessInstance({
      processInstanceKey: task.processInstanceKey,
      activateInstructions: [{
        elementId: task.elementId,
        ancestorElementInstanceKey: "-1",
         variableInstructions: [],
      }]
    })
  },

  async refreshTask(task: Task) {
    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `No task can be refreshed if zeebe is not connected.`);
    }

    await this.setTaskToActivateToANewJob(task)

    // fail the old jobs here, or we may get a 'two jobs' for the same element scenario
    await this.fail(
      task,
      0,
      'Some participants has been changed and a new job as been created. This is a safe fail.'
    )

    await Tasks.removeAsync({ '_id': task._id })
  },

  async replyWithReceipt(job: PhDZeebeJob) {
    /*
      Inform Zeebe that the job is ready to be completed by users, and he can send notifications to them
      tip: publishStartMessage is idempotent if messageId is set
     */
    // only send a receipt for jobs with a recent workflow -> with the needed variables to trigger a notification
    if (
      job.variables.uuid &&
      job.customHeaders.notifyTo &&
      job.customHeaders.notifySubject &&
      job.customHeaders.notifyMessage
    ) {

      // Idempotency check : skip the call for notification if this job elementId has been already sent
      if (job.variables.notificationLogs) {
        const hasBeenAlreadySent = job.variables.notificationLogs
                                      .map( (notificationLog: string) => {
                                        const log = JSON.parse(notificationLog) as NotificationLog
                                        return log?.fromElementId
                                      })
                                      .includes( job.elementId )

        if (hasBeenAlreadySent) {
          console.debug('Not sending a call for notification as this element has already been notified')
          return
        }
      }

      debug(`Job ${job.key} is eligible for a notification receipt. Sending the receipt...`)

      // as the To, Cc or Bcc can come as string, a string of array of string (!, yep that's something like that : "[email1, email2]"), and
      // some are empty, let's have a function that process them correctly. They are all field specifier, not direct values
      const parseCustomHeadersNotify = (notifyVar: string | undefined) => {
        if (! notifyVar ) return

        if (/^\[.*\]$/.test(notifyVar)) {
          const array = notifyVar.slice(1, -1).split(',').map(item => item.trim());

          return array.reduce( (result, fieldSpec) => {
            // ignore if the field does not exist
            if (job.variables[fieldSpec]) result.push(encrypt(job.variables[fieldSpec]))
            return result;
          }, [] as string[]) ?? undefined

        } else {
          return job.variables[job.customHeaders.notifyTo!] ?
            encrypt(job.variables[job.customHeaders.notifyTo!]) : undefined
        }
      }

      // There are no a direct value, but a field specifier inside the variables. So get the field content here
      const notifyTo = parseCustomHeadersNotify( job.customHeaders.notifyTo )

      const notifyCc = parseCustomHeadersNotify( job.customHeaders.notifyCc )

      const notifyBcc = parseCustomHeadersNotify( job.customHeaders.notifyBcc )

      const notifySubject = job.customHeaders.notifySubject ? encrypt(job.customHeaders.notifySubject) : undefined
      const notifyMessage = job.customHeaders.notifyMessage ? encrypt(job.customHeaders.notifyMessage) : undefined

      // check message validity before sending to notifier
      if (!notifyTo) {
        console.error(`Will not sent a notification receipt, as the 'to' is missing for job ${ job.key }`)
        return
      }
      if (!notifySubject) {
        console.error(`Will not sent a notification receipt, as the 'subject' is missing for job ${ job.key }`)
        return
      }
      if (!notifyMessage) {
        console.error(`Will not sent a notification receipt, as the 'message' is missing for job ${ job.key }`)
        return
      }

      zBClient!.publishMessage({
        // to have one idempotent message per fillForm activity task, sign it with the current step
        messageId: `${ job.elementId }-${ job.variables.uuid }`,
        correlationKey: job.variables.uuid,
        name: 'Message_notify',
        variables: {
          to: notifyTo,
          cc: notifyCc,
          bcc: notifyBcc,
          subject: notifySubject,
          message: notifyMessage,
          fromElementId: encrypt(job.elementId),
          pdfType: job.customHeaders.pdfType ? encrypt(job.customHeaders.pdfType) : undefined,
          pdfName: job.customHeaders.pdfName ? encrypt(job.customHeaders.pdfName) : undefined,
        } as NotificationStartMessage
      }).then( () => { debug(`Notification receipt sent for Job ${job.key}.`) } )
    }
  }
}
