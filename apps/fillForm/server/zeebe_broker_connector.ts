import {Meteor} from 'meteor/meteor'
import {MongoInternals} from "meteor/mongo"
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus"
import {Metrics} from '/server/prometheus'
import {decrypt} from "/server/encryption"
import debug_ from 'debug'
import {
  Duration,
  Job,
  IOutputVariables,
  JobCompletionInterface
} from "zeebe-node"
import {
  Task,
  Tasks
} from "/imports/model/tasks"
import {PhDCustomHeaderShape, PhDInputVariables} from "/imports/model/tasksTypes";
import {auditLogConsoleOut} from "/imports/lib/logging";

const debug = debug_('phd-assess:zeebe-connector')
const auditLog = auditLogConsoleOut.extend('server/zeebe_broker_connector')

// what is sent as result
// should be the whole form, or an ACL decided value
interface OutputVariables {
  [key: string]: any
}

// redeclare what is a job in the PhD context
interface PhDZeebeJob<WorkerInputVariables = PhDInputVariables, CustomHeaderShape = PhDCustomHeaderShape, WorkerOutputVariables = IOutputVariables> extends Job<WorkerInputVariables, CustomHeaderShape>, JobCompletionInterface<WorkerOutputVariables> {
}

// list which variables are not encrypted.
const nonEncryptedVariables = [
  'dashboardDefinition',
]

export let zBClient: ZeebeSpreadingClient | null = null

function zeebeJobToTask(job: PhDZeebeJob): Task {
  // decrypt the variables before saving into memory
  const decryptedVariables: any = {}
  let undecryptableVariablesKey: string[] = []

  Object.keys(job.variables).map((key) => {
    try {
      if (nonEncryptedVariables.includes(key)) {
        decryptedVariables[key] = job.variables[key]
      } else if (job.variables[key] == null) {  // null is a "defined" valid json entry
        decryptedVariables[key] = null
      } else if (Array.isArray(job.variables[key])) {
        decryptedVariables[key] = job.variables[key].reduce((acc: string[], item: string) => {
            acc.push(decrypt(item))
            return acc
          }, [])
      } else {
        decryptedVariables[key] = decrypt(job.variables[key])
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

  const { insertedId } = Tasks.upsert(
    job.key,
    {
      $setOnInsert: zeebeJobToTask(job),
      // add journal about operations on this task
      $inc: { "journal.seenCount": 1 },
      $set: { "journal.lastSeen": new Date() },
    })

  if (insertedId !== undefined) {
    debug(`Received a new job from Zeebe ${ insertedId }`)
    status = PersistOutcome.NEW
  } else {
    status = PersistOutcome.ALREADY_KNOWN
  }

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
  }
}
