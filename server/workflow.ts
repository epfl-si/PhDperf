import _ from 'lodash'
import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {ZBClient as ZeebeClient, CompleteFn, ZBWorkerTaskHandler} from 'zeebe-node'
import {zeebeStatusCollection} from "/imports/api/zeebeStatus";

import {
  PerfWorkflowTaskData, perfWorkflowTasksCollection,
  PerfWorkflowVariables, PerfWorkflowHeaders
} from '/imports/api/perf-workflow-tasks'

import debug_ from 'debug'
const debug = debug_('server/workflow')

const PerfWorkflowTasks = perfWorkflowTasksCollection<PerfWorkflowTaskData>()
const workersTask: { [key: string]: CompleteFn<any> } = {}

Meteor.publish(
  'zeebe.status', function () { return zeebeStatusCollection.find(); }
)

zeebeStatusCollection.insert({status: 'not connected'})

export default {
  start() {
    const taskType = 'fill_form'
    //const taskType = 'send_email'
    zeebeStatusCollection.insert({status: 'starting'})

    const ZBClient = new ZeebeClient(
      {
        loglevel: 'DEBUG'
        //pollInterval: Duration.seconds.of(85),
        //longPoll:
      }
    )

    // Keep a trace of the client state
    ZBClient.on('ready', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({status: 'Ready'})))
    ZBClient.on('close', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({status: 'Closed'})))
    ZBClient.on('connectionError', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({status: 'Error'})))
    ZBClient.on('unknown', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({status: 'Unknown'})))

    // Just a shot in the dark - Could just as well be
    // `elementInstanceKey` or `workflowInstanceKey`
    const keyField = 'key'

    debug(`creating Zeebe worker of type "${taskType}"`);

    ZBClient.createWorker({
      taskType: taskType,
      maxJobsToActivate: 60,
      // TODO: check what is needed there
      taskHandler:
        Meteor.bindEnvironment(/* therefore, Fiber'd */
          (instance, completed) => {

            // TODO: once we get there, it may means we got a poll done,
            //  so take the time to check the one we have in cache, and if they are invalid,
            //  set status to floating

            const key: string = instance[keyField]
            const keyStruct = _.pick(instance, [keyField])
            const upserted = PerfWorkflowTasks.upsert(keyStruct, {$set: instance})

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
          }) as ZBWorkerTaskHandler<PerfWorkflowVariables, PerfWorkflowHeaders>,
    })
  },
  find(query: any): Mongo.Cursor<PerfWorkflowTaskData> {
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
