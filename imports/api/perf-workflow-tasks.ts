import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { ZeebeJob } from 'zeebe-node'

import {Sciper} from "/imports/api/datatypes";

// This are the well-known variables
// use  theclass trick to be able to read keys later
// see https://stackoverflow.com/a/59806829
export class MyInputVariables {
  assigneeSciper?: Sciper
  programAssistantSciper?: Sciper
  phdStudentSciper?: Sciper
  thesisDirectorSciper?: Sciper
  thesisCoDirectorSciper?: Sciper
  programDirectorSciper?: Sciper
  mentorSciper?: Sciper
}

export interface WorkerInputVariables extends MyInputVariables {
  [key: string]: any  // all the thing we dont know already
}

interface CustomHeaderShape {
  groups: string[]
  title: string
  formIO: string
}

export type PhDJob = ZeebeJob<WorkerInputVariables, CustomHeaderShape>

export type TaskData = PhDJob & {
  lastSeen?: Date
}

const collectionName = 'tasks'

// Due to restrictions in the Meteor model, this function can only be
// called once per locus (i.e. once in the client and once in the
// server).
export function TasksCollection<U>(transform ?: (doc: TaskData) => U) {
  return new Mongo.Collection<TaskData, U>(
    collectionName,
    // The collection is *not* persistent server-side; instead, it gets fed from Zeebe
    Meteor.isServer ? { connection : null, transform } : { transform })
}
