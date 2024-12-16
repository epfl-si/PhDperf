/**
 * Everything about connecting to Zeebe
 */

import {Meteor} from "meteor/meteor";
import {Metrics} from "/server/prometheus";
import {MongoInternals} from "meteor/mongo";
import {Duration, PublishMessageRequest} from "zeebe-node";

import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus";
import {encrypt} from "/server/encryption";
import {bumpActivityLogsOnTaskNewArrival} from "/imports/api/activityLogs/helpers";
import {Task, Tasks} from "/imports/model/tasks";
import {PhDAssessCustomVariables} from "phd-assess-meta/types/variables";
import {NotificationLog, NotificationStartMessage} from "phd-assess-meta/types/notification";

import { PhDZeebeJob, persistJob, PersistOutcome } from "./in";

import debug_ from "debug";
import {auditLogConsoleOut} from "/imports/lib/logging";
const debug = debug_('phd-assess:zeebe:connector')
const auditLog = auditLogConsoleOut.extend('server/zeebe/connector')


export let zBClient: ZeebeSpreadingClient | null = null

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

              // message user about the task awaiting
              this.replyWithReceipt(job).then( ()=> {} )

              // log the arrival time for the new workflows
              if (job.variables.uuid) bumpActivityLogsOnTaskNewArrival(job)
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
    variables: Partial<PhDAssessCustomVariables>,
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
            if (job.variables[fieldSpec]) result.push(encrypt(job.variables[fieldSpec])!)
            return result;
          }, [] as string[]) ?? undefined

        } else {
          return job.variables[notifyVar] ?
            encrypt(job.variables[notifyVar]) : undefined
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
          type: encrypt('awaitingForm')
        } as NotificationStartMessage
      }).then( () => { debug(`Notification receipt sent for Job ${job.key}.`) } )
    }
  }
}
