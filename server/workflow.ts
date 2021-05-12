import _ from 'lodash'
import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {Duration, ZBWorkerTaskHandler, ZeebeJob} from 'zeebe-node'
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus";
import {decrypt} from "/server/encryption";
import {
  FillFormTaskData, fillFormTasksCollection,
  PhDWorkflowInstanceVariables, FillFormJobHeaders
} from '/imports/api/perf-workflow-tasks'

import debug_ from 'debug'

const debug = debug_('server/workflow')

const PerfWorkflowTasks = fillFormTasksCollection<FillFormTaskData>()
const zeebeJobs: { [key: string]: ZeebeJob<any> } = {}

export default {
  start() {
    const taskType = 'fill_form'
    const zBClient = new ZeebeSpreadingClient({})

    // Just a shot in the dark - Could just as well be
    // `elementInstanceKey` or `workflowInstanceKey`
    const keyField = 'key'

    debug(`creating Zeebe worker of type "${taskType}"`);

    zBClient.createWorker({
      taskType: taskType,
      maxJobsToActivate: 60,
      // set a short timeout, as we use the decoupled job pattern
      // and other servers (if any) can claimed the jobs too
      timeout: Duration.milliseconds.of(1),
      // load every job into the inmemory server db
      taskHandler:
      // therefore, Fiber'd
        Meteor.bindEnvironment(
          (job,
          ) => {
            const key: string = job[keyField]
            const keyStruct = _.pick(job, [keyField])

            // to decrypt the variables and keep the typed values in the same process,
            // we transform the job to a MutableJob type, by removing the readonly status
            type MutableJob<FillFormTaskData> = { -readonly [P in keyof FillFormTaskData]: FillFormTaskData[P] }
            let instanceToMongo: MutableJob<any> = job

            Object.keys(instanceToMongo['variables']).map((key) => {
              instanceToMongo['variables'][key] = decrypt(instanceToMongo['variables'][key])
            })

            const upserted = PerfWorkflowTasks.upsert(keyStruct, {$set: instanceToMongo})

            if (upserted.insertedId) {
              debug(`Received a new job from Zeebe ${JSON.stringify(keyStruct)}`)
              zeebeJobs[key] = job
            }

            return job.forward()  // tell Zeebe that result may come later, and free ourself for an another work
          }) as ZBWorkerTaskHandler<PhDWorkflowInstanceVariables, FillFormJobHeaders>,
    })
  },
  find(query: any): Mongo.Cursor<FillFormTaskData> {
    return PerfWorkflowTasks.find(query)
  },
  async success(key: string, workerResult: any) {
    debug(`Sending success to worker ${key} with result ${JSON.stringify(workerResult)}`)
    await zeebeJobs[key].complete(workerResult)
    debug(`Worker ${key} successfully closed  with the success state`)
    delete zeebeJobs[key]
    PerfWorkflowTasks.remove({key})
    debug(`Worker ${key} successfully removed from server memory`)
  }
}
