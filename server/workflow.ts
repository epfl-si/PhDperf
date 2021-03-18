import _ from 'lodash'
import { Mongo } from 'meteor/mongo'
import { Meteor } from 'meteor/meteor'
import { ZBClient, CompleteFn, ZBWorkerTaskHandler } from 'zeebe-node'

import { PerfWorkflowTaskData, perfWorkflowTasksCollection,
         PerfWorkflowVariables, PerfWorkflowHeaders } from '/imports/api/perf-workflow-tasks'

import debug_ from 'debug'
const debug = debug_('server/workflow')

const PerfWorkflowTasks = perfWorkflowTasksCollection<PerfWorkflowTaskData>()

export class WorkflowClient {
  private static singleton : WorkflowClient
  static the () {
    if (! WorkflowClient.singleton) {
      WorkflowClient.singleton = new WorkflowClient()
    }
    return WorkflowClient.singleton
  }

  private constructor() {}

  public start() {
    const zbc = new ZBClient()

    // Just a shot in the dark - Could just as well be
    // `elementInstanceKey` or `workflowInstanceKey`
    const keyField = 'key'

    const completeds : { [key : string] : CompleteFn<any> } = {}

    zbc.createWorker({
      taskType: 'fill_sectionA',
      taskHandler: Meteor.bindEnvironment(/* therefore, Fiber'd */ function(instance, completed) {
        const key : string = instance[keyField],
          keyStruct = _.pick(instance, [keyField])
        const upserted = PerfWorkflowTasks.upsert(keyStruct, { $set: instance })
        if (upserted.insertedId) {
          debug(`Received ${JSON.stringify(keyStruct)} from Zeebe`)
          completeds[key] = completed
        }
        completed.forwarded()
      }) as ZBWorkerTaskHandler<PerfWorkflowVariables, PerfWorkflowHeaders>,
      maxJobsToActivate: 60
    })
  }

  public find(query : any) : Mongo.Cursor<PerfWorkflowTaskData> {
    return PerfWorkflowTasks.find(query)
  }
}
