import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import {Sciper} from "/imports/api/datatypes";

export interface FormioActivityLog {
  timezone?: string;
  offset?: number;
  origin?: string;
  referrer?: string;
  browserName?: string;
  userAgent?: string;
  pathName?: string;
  onLine?: boolean;
}

export interface TaskParticipant {
  sciper: Sciper
  displayName?: string
  role: string
  isAssignee: boolean
}

export type TaskData = {
  _id: string
  created_by?: Sciper
  created_at?: Date
  updated_at?: Date
  lastSeen?: Date
  title?: string
  participants?: TaskParticipant[]
  formIO: string
  zeebeInfo: any
  variables?: any
  activityLogs?: FormioActivityLog[]
}

// Due to restrictions in the Meteor model, this function can only be
// called once per locus (i.e. once in the client and once in the
// server).
export function TasksCollection<U>(transform ?: (doc: TaskData) => U) {
  const collectionName = 'tasks'

  return new Mongo.Collection<TaskData, U>(
    collectionName,
    // The collection is *not* persistent server-side; instead, it gets fed from Zeebe
    Meteor.isServer ? { connection : null, transform } : { transform })
}
