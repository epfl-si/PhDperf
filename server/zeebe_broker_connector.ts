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
import { TaskObservables } from '/imports/model/observability'
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

export let zBClient: ZeebeSpreadingClient | null = null

function zeebeJobToTask(job: PhDZeebeJob): Task {
  // decrypt the variables before saving into memory (keep the typed values too)
  // Typescript hack with the "any" : make it writable by bypassing typescript. Well know it's bad,
  // but still, better than rebuilding the whole Zeebe interfaces to get it writeable
  const decryptedVariables: PhDInputVariables = {}
  let undecryptableVariablesKey: string[] = []

  Object.keys(job.variables).map((key) => {
    try {
      if (job.variables[key] == null) {  // null is a "defined" valid json entry
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
  task.variables = decryptedVariables

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
function persistJob (job: PhDZeebeJob, to_collection: typeof Tasks) : PersistOutcome {
  let status : PersistOutcome

  // assert before inserting that this task is not already submitted
  if (TaskObservables.find({ _id: job.key, submittedAt: { $exists:true } }).count() !== 0) {
    auditLog(`Refusing to add this task ( job key: ${job.key}, process instance : ${job.processInstanceKey} ) to meteor, as it was flagged as already submitted`)
    return PersistOutcome.ALREADY_SUBMITTED
  }

  const { insertedId } = to_collection.upsert(
    job.key,
    {
      $setOnInsert: zeebeJobToTask(job)
    })

  if (insertedId !== undefined) {
    debug(`Received a new job from Zeebe ${ insertedId }`)
    status = PersistOutcome.NEW
  } else {
    status = PersistOutcome.ALREADY_KNOWN
  }

  try {
    TaskObservables.upsert(
      job.key,
      {
        $inc: { seenCount: 1 },
        $set: { lastSeen: new Date() },
      })
  } catch (e){
    console.error("Unable to insert event into `tasks_journal` collection", e)
  }

  return status
}

export default {
  start() {
    const taskType = 'phdAssessFillForm'

    zBClient = new ZeebeSpreadingClient()

    debug(`creating Zeebe worker of type "${taskType}"...`);
    zBClient.createWorker({
      taskType: taskType,
      maxJobsToActivate: process.env.ZEEBE_WORKER_MAX_JOBS_TO_ACTIVATE ?? 500,
      // Set timeout, the same as we will ask yourself if the job is still up
      timeout: process.env.ZEEBE_WORKER_TIMEOUT ?? Duration.seconds.of(20),
      // load every job into the in-memory server db
      taskHandler:
        Meteor.bindEnvironment(      // therefore, Fiber'd
          (job: PhDZeebeJob,
          ) => {
            Metrics.zeebe.received.inc()
            let outcome: PersistOutcome

            try {
              outcome = persistJob(job, Tasks)
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
