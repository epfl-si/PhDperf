import _ from 'lodash'
import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {CompleteFn, ZBWorkerTaskHandler} from 'zeebe-node'
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus";
import {decrypt} from "/server/encryption";
import {
  FillFormTaskData, fillFormTasksCollection,
  PhDWorkflowInstanceVariables, FillFormJobHeaders
} from '/imports/api/perf-workflow-tasks'

import debug_ from 'debug'
const debug = debug_('server/workflow')

const PerfWorkflowTasks = fillFormTasksCollection<FillFormTaskData>()
const workersTask: { [key: string]: CompleteFn<any> } = {}

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
      taskHandler:
        Meteor.bindEnvironment(/* therefore, Fiber'd */
          (instance, completed) => {

            // TODO: once we get there, it may means we got a poll done,
            //  so take the time to check the one we have in cache, and if they are invalid,
            //  set status to floating

            const key: string = instance[keyField]
            const keyStruct = _.pick(instance, [keyField])

            /* decrypt the variables, as they are the one with some confidentiality */
            // same as PerfWorkflowTask, but make variable editable
            type MutableJob<FillFormTaskData> = { -readonly [P in keyof FillFormTaskData]: FillFormTaskData[P] }
            let instanceToMongo: MutableJob<any> = instance

            Object.keys(instanceToMongo['variables']).map((key) => {
              instanceToMongo['variables'][key] = decrypt(instanceToMongo['variables'][key])
            })

            const upserted = PerfWorkflowTasks.upsert(keyStruct, {$set: instanceToMongo})

            if (upserted.insertedId) {
              debug(`Received a new job from Zeebe ${JSON.stringify(keyStruct)}`)
              workersTask[key] = completed
            }
            /*
            if (upserted.numberAffected && upserted.numberAffected > 0) {
              if (upserted.insertedId) {
                debug(`Received a new job from Zeebe ${JSON.stringify(keyStruct)}`)
                workersTask[key] = completed
              } else {
                // TODO: do we need this ?
                debug(`Updating an existing job ${JSON.stringify(keyStruct)}`)
              }
            }
*/
            completed.forwarded()  // tell Zeebe that result may come later, and free ourself for an another work
          }) as ZBWorkerTaskHandler<PhDWorkflowInstanceVariables, FillFormJobHeaders>,
    })
  },
  find(query: any): Mongo.Cursor<FillFormTaskData> {
    return PerfWorkflowTasks.find(query)
  },
  success(key: string, workerResult: any) {
    debug(`Sending success to worker ${key} with result ${JSON.stringify(workerResult)}`)
    workersTask[key].success(workerResult)
    debug(`Worker ${key} successfully closed  with the success state`)
    delete workersTask[key]
    PerfWorkflowTasks.remove({key})
    debug(`Worker ${key} successfully removed from server memory`)
  }
}
