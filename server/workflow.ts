import _ from 'lodash'
import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {ZBClient, CompleteFn, ZBWorkerTaskHandler} from 'zeebe-node'

import {
    PerfWorkflowTaskData, perfWorkflowTasksCollection,
    PerfWorkflowVariables, PerfWorkflowHeaders
} from '/imports/api/perf-workflow-tasks'

import debug_ from 'debug'

const debug = debug_('server/workflow')

const PerfWorkflowTasks = perfWorkflowTasksCollection<PerfWorkflowTaskData>()
const workers: { [key: string]: CompleteFn<any> } = {}

export default {
    start() {
        const zbc = new ZBClient()

        // Just a shot in the dark - Could just as well be
        // `elementInstanceKey` or `workflowInstanceKey`
        const keyField = 'key'

        console.debug('fetching work "choose_form_filler"');

        zbc.createWorker({
            taskType: 'choose_form_filler',
            taskHandler:
                Meteor.bindEnvironment(/* therefore, Fiber'd */
                    (instance, completed) => {
                        const key: string = instance[keyField]
                        const keyStruct = _.pick(instance, [keyField])
                        const upserted = PerfWorkflowTasks.upsert(keyStruct, {$set: instance})

                        if (upserted.insertedId) {
                            debug(`Received ${JSON.stringify(keyStruct)} from Zeebe`)
                            workers[key] = completed
                        }

                        completed.forwarded()
                    }) as ZBWorkerTaskHandler<PerfWorkflowVariables, PerfWorkflowHeaders>,
            maxJobsToActivate: 60
        })
    },
    find(query: any): Mongo.Cursor<PerfWorkflowTaskData> {
        return PerfWorkflowTasks.find(query)
    },
    success(key: string, workerResult: any) {
        console.debug(`Sending success to worker ${key} with result ${JSON.stringify(workerResult)}`)
        workers[key].success(workerResult)
        console.debug(`Worker ${key} successfully closed  with the success state`)
        delete workers[key]
        PerfWorkflowTasks.remove({key} )
        console.debug(`Worker ${key} successfully removed from server memory`)
    }
}
