import _ from 'lodash'
import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {Duration, ZBWorkerTaskHandler} from 'zeebe-node'
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus";
import {decrypt} from "/server/encryption";
import {
  FillFormTaskData, fillFormTasksCollection,
  PhDWorkflowInstanceVariables, FillFormJobHeaders
} from '/imports/api/perf-workflow-tasks'

import debug_ from 'debug'

const debug = debug_('server/workflow')

const PerfWorkflowTasks = fillFormTasksCollection<FillFormTaskData>()
let zBClient: ZeebeSpreadingClient | null = null

export default {
  start() {
    const taskType = 'phdAssessFillForm'
    const jobKeyField = 'key'

    zBClient = new ZeebeSpreadingClient({
      pollInterval: Duration.seconds.of(2)
    })

    debug(`creating Zeebe worker of type "${taskType}"...`);
    zBClient.createWorker({
      taskType: taskType,
      maxJobsToActivate: 500,
      // Set timeout, the same as we will ask yourself if the job is still up
      timeout: Duration.minutes.of(5),
      // load every job into the in-memory server db
      taskHandler:
      // therefore, Fiber'd
        Meteor.bindEnvironment(
          (job,
          ) => {
            let jobKey: string = _.pick(job, [jobKeyField]).toString()

            let task:FillFormTaskData | undefined = PerfWorkflowTasks.findOne(jobKey)

            if (!task) {  // Let's insert this unknown task
              // decrypt the variables before saving into memory (keep the typed values too)
              let instanceToMongo: any = job  // make it writable

              Object.keys(instanceToMongo['variables']).map((key) => {
                instanceToMongo['variables'][key] = decrypt(instanceToMongo['variables'][key])
              })

              jobKey = PerfWorkflowTasks.insert(instanceToMongo)

              debug(`Received a new job from Zeebe ${JSON.stringify(jobKey)}`)
            }

            // To keep insync with Zeebe, log the last time we see this one
            PerfWorkflowTasks.update({ _id: jobKey },{ $set: { lastSeen: new Date() }});

            return job.forward()  // tell Zeebe that result may come later, and free ourself for an another work

          }) as ZBWorkerTaskHandler<PhDWorkflowInstanceVariables, FillFormJobHeaders>,
    })
    debug(`Zeebe worker "${taskType}" created`);
  },
  find(query: any): Mongo.Cursor<FillFormTaskData> {
    return PerfWorkflowTasks.find(query)
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

    PerfWorkflowTasks.remove({key})
    debug(`Worker ${key} successfully removed from server memory`)
  }
}
