import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import {Sciper} from "/imports/api/datatypes";
import {ICustomHeaders, IInputVariables, Job} from "zeebe-node";

export class PhDCustomHeaderShape implements ICustomHeaders {
  groups?: string[]  // manage permission groupwise
  title?: string  // title shown for this task
  formIO?: string  // the formIO JSON
  [key: string]: any  // the others var
}

// Log what happens on every steps
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

// throw in a flatten partipants list
// dont' try to hide it under a structured var, as
// participants.mentor is not a thing with zeebe + crypted data
export interface Participants {
  programAssistantSciper?: Sciper
  programAssistantInfo?: string
  phdStudentSciper?: Sciper
  phdStudentInfo?: string
  thesisDirectorSciper?: Sciper
  thesisDirectorInfo?: string
  thesisCoDirectorSciper?: Sciper
  thesisCoDirectorInfo?: string
  programDirectorSciper?: Sciper
  programDirectorInfo?: string
  mentorSciper?: Sciper
  mentorInfo?: string
}

// This are the bpmn variables we could find for every steps and
// we will need through the code.
// Why a class instead an interface here ? To be able to read the
// keys later in the process. See https://stackoverflow.com/a/59806829
export interface PhDInputVariables extends Participants, IInputVariables {
  created_by?: Sciper
  created_at?: Date  // JSON date
  updated_at?: Date  // JSON date
  activityLogs?: FormioActivityLog[]
  //[key: string]: any  // the others var
}

// Model the task on what we await from zeebe
export interface Task<WorkerInputVariables = PhDInputVariables, CustomHeaderShape = PhDCustomHeaderShape> extends Job<WorkerInputVariables, CustomHeaderShape> {
}

// add lastSeen for sync utilities
export type TaskData = Task & {
  _id: string
  lastSeen?: Date
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
