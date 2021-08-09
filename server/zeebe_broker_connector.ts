import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {Duration} from 'zeebe-node'
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus";
import {decrypt} from "/server/encryption";
import {
  TaskData, TasksCollection, PhDJob
} from '/imports/api/perf-workflow-tasks'
import debug_ from 'debug'

const debug = debug_('phdAssess:server:workflow')

const tasks = TasksCollection<TaskData>()
let zBClient: ZeebeSpreadingClient | null = null

export default {
  start() {
    const taskType = 'phdAssessFillForm'
    const jobKeyField = 'key'

    zBClient = new ZeebeSpreadingClient({
      pollInterval: Duration.seconds.of(5)
    })

    debug(`creating Zeebe worker of type "${taskType}"...`);
    zBClient.createWorker({
      taskType: taskType,
      maxJobsToActivate: 500,
      // Set timeout, the same as we will ask yourself if the job is still up
      timeout: Duration.milliseconds.of(1),
      // load every job into the in-memory server db
      taskHandler:
      // therefore, Fiber'd
        Meteor.bindEnvironment(
          (job: PhDJob,
          ) => {
            const jobKey: string = job[jobKeyField]

            let task:TaskData | undefined = tasks.findOne({ _id: jobKey } )

            if (!task) {  // Let's insert this unknown task
              // decrypt the variables before saving into memory (keep the typed values too)
              // Typescript hack with the "any" : make it writable by bypassing typescript. Well know it's bad,
              // but still, better than rebuilding the whole Zeebe interfaces to get it writeable
              let instanceToMongo: any = job

              Object.keys(instanceToMongo['variables']).map((key) => {
                instanceToMongo['variables'][key] = decrypt(job.variables[key])
              })

              instanceToMongo['_id'] = jobKey
              tasks.insert(instanceToMongo)

              debug(`Received a new job from Zeebe ${JSON.stringify(jobKey)}`)
            }

            // To keep insync with Zeebe, log the last time we see this one
            //tasks.update({ _id: jobKey },{ $set: { lastSeen: new Date() }});

            return job.forward()  // tell Zeebe that result may come later, and free ourself for an another work
          })
    })
    debug(`Zeebe worker "${taskType}" created`);
  },
  find(query: any): Mongo.Cursor<TaskData> {
    return tasks.find(query)
  },
  async success(key: string, workerResult: any) {
    debug(`Sending success to worker ${key} with result ${JSON.stringify(workerResult)}`)

    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `The task ${key} can not be closed if zeebe is not connected.`);
    }

    await zBClient?.completeJob({
      jobKey: key,
      variables: workerResult,
    })
    debug(`Worker ${key} successfully closed  with the success state`)

    tasks.remove({key})
    debug(`Worker ${key} successfully removed from server memory`)
  }
}
