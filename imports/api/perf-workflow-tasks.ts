import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Job } from 'zeebe-node'

import {LDAPUser} from "meteor/epfl:ldap";

export type PhDWorkflowInstanceVariables = {
  assignee: LDAPUser
  programAssistant: LDAPUser
  phdStudent: LDAPUser
  thesisDirector: LDAPUser
  thesisCoDirector: LDAPUser
  programDirector: LDAPUser
  mentor: LDAPUser
}

export type FillFormJobHeaders = {
  groups: string[]
  title: string
  formIO: string
}

type FillFormTaskDataBase = Job<PhDWorkflowInstanceVariables, FillFormJobHeaders>

export type FillFormTaskData = FillFormTaskDataBase & {
  lastSeen?: Date
}

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
