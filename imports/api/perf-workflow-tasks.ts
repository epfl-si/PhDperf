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

export type PerfWorkflowTask = Job<PerfWorkflowVariables, PerfWorkflowHeaders>

const collectionName = 'perf-workflow-tasks'

export const PerfWorkflowTasks : Mongo.Collection<PerfWorkflowTask> =
  new Mongo.Collection<PerfWorkflowTask>(
    collectionName,
    Meteor.isServer ?
      // The collection is *not* persistent server-side; instead, it gets fed from Zeebe
      {connection: null} :
      undefined)
