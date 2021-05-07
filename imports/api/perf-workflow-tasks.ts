import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Job } from 'zeebe-node'

import { Sciper } from './datatypes'

export type PhDWorkflowInstanceVariables = {
  programAssistant: Sciper
  phDStudentsSciper: Sciper
  mentorSciper: Sciper
  programDirector: Sciper
  thesisDirector: Sciper
}

export type FillFormJobHeaders = {
  groups: string[]
  title: string
  form_io: string
}

export type FillFormTaskData = Job<PhDWorkflowInstanceVariables, FillFormJobHeaders>

const collectionName = 'fill-form-tasks'

// Due to restrictions in the Meteor model, this function can only be
// called once per locus (i.e. once in the client and once in the
// server).
export function fillFormTasksCollection<U>(transform ?: (doc: FillFormTaskData) => U) {
  return new Mongo.Collection<FillFormTaskData, U>(
    collectionName,
    // The collection is *not* persistent server-side; instead, it gets fed from Zeebe
    Meteor.isServer ? { connection : null, transform } : { transform })
}
