import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Job } from 'zeebe-node'

import { Sciper } from './datatypes'

export type PerfWorkflowVariables = {
  studentSciper: Sciper
}

export type PerfWorkflowHeaders = {
  form_io: string
}

export type PerfWorkflowTaskData = Job<PerfWorkflowVariables, PerfWorkflowHeaders>

const collectionName = 'perf-workflow-tasks'

// Due to restrictions in the Meteor model, this function can only be
// called once per locus (i.e. once in the client and once in the
// server).
export function perfWorkflowTasksCollection<U>(transform ?: (doc: PerfWorkflowTaskData) => U) {
  return new Mongo.Collection<PerfWorkflowTaskData, U>(
    collectionName,
    // The collection is *not* persistent server-side; instead, it gets fed from Zeebe
    Meteor.isServer ? { connection : null, transform } : { transform })
}
