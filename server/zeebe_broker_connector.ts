import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus"
import {decrypt} from "/server/encryption"
import debug_ from 'debug'
import {
  Duration,
  Job,
  IOutputVariables,
  JobCompletionInterface
} from "zeebe-node"
import {
  PhDCustomHeaderShape,
  PhDInputVariables,
  TaskData,
  TasksCollection
} from "/imports/model/tasks"

const debug = debug_('phdAssess:server:workflow')

// what is send as result
// should be the whole form, or an ACL decided value
interface OutputVariables {
  [key: string]: any
}

// redeclare what is a job in the PhD context
interface PhDZeebeJob<WorkerInputVariables = PhDInputVariables, CustomHeaderShape = PhDCustomHeaderShape, WorkerOutputVariables = IOutputVariables> extends Job<WorkerInputVariables, CustomHeaderShape>, JobCompletionInterface<WorkerOutputVariables> {
}

const tasks = TasksCollection<TaskData>()
export let zBClient: ZeebeSpreadingClient | null = null

function zeebeJobToTask(job: PhDZeebeJob): TaskData {
  // decrypt the variables before saving into memory (keep the typed values too)
  // Typescript hack with the "any" : make it writable by bypassing typescript. Well know it's bad,
  // but still, better than rebuilding the whole Zeebe interfaces to get it writeable
  const decryptedVariables: PhDInputVariables = {}
  const undecryptableVariablesKey: string[] = []

  Object.keys(job.variables).map((key) => {
    try {
      if (Array.isArray(job.variables[key])) {key
        decryptedVariables[key] = job.variables[key].reduce((acc: string[], item: string) => {
            acc.push(decrypt(item))
            return acc
          }, [])
      } else {
        decryptedVariables[key] = decrypt(job.variables[key])
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        // not good, some values are not readable. Get the error for now,
        // but raise it after the whole decrypt
        // we may need to do something afterward
        debug(`Can't decrypt the key: ${key}`)
        undecryptableVariablesKey.push(key)
      } else {
        throw e
      }
    }
  })

  return Object.assign(job, {
    _id: job.key,
    variables: decryptedVariables,
    undecryptableVariablesKey: undecryptableVariablesKey
  })
}

export default {
  start() {
    const taskType = 'phdAssessFillForm'

    zBClient = new ZeebeSpreadingClient({
      pollInterval: Duration.seconds.of(5)
    })

    debug(`creating Zeebe worker of type "${taskType}"...`);
    zBClient.createWorker({
      taskType: taskType,
      maxJobsToActivate: 500,
      // Set timeout, the same as we will ask yourself if the job is still up
      timeout: Duration.seconds.of(20),
      // load every job into the in-memory server db
      taskHandler:
      // therefore, Fiber'd
        Meteor.bindEnvironment(
          (job: PhDZeebeJob,
          ) => {
            let task_id: string | undefined;

            if (!tasks.findOne({ _id: job.key } )) {  // Let's add this unknown task
              let newTask = zeebeJobToTask(job)
              task_id = tasks.insert(newTask)
              debug(`Received a new job from Zeebe ${ task_id }`)
            }

            return job.forward()  // tell Zeebe that result may come later, and free ourself for an another work
          })
    })
    debug(`Zeebe worker "${taskType}" created`);
  },

  find(query: any): Mongo.Cursor<TaskData> {
    return tasks.find(query)
  },

  async success(key: string, workerResult: OutputVariables) {
    debug(`Sending success to worker ${key} with result ${JSON.stringify(workerResult)}`)

    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `The task ${key} can not be closed if zeebe is not connected.`);
    }

    await zBClient?.completeJob({
      jobKey: key,
      variables: workerResult,
    })
    debug(`Worker ${key} sent complete and successful status to Zeebe`)
  }
}
