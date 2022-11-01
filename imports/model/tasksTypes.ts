import {ICustomHeaders, IInputVariables, Job} from "zeebe-node";
import {ZeebeParticipantsVariables} from "./participants";
import {Sciper} from "../api/datatypes";

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

// This are the bpmn variables we could find for every steps and
// we will need through the code.
// Why a class instead an interface here ? To be able to read the
// keys later in the process. See https://stackoverflow.com/a/59806829
export interface PhDInputVariables extends ZeebeParticipantsVariables, IInputVariables {
  assigneeSciper?: Sciper | Sciper[]
  created_by?: Sciper
  created_at?: string  // JSON date
  updated_at?: string  // JSON date
  activityLogs?: string
  //[key: string]: any  // the others var
}

export type TaskJournal = {
  // The number of times we received an ActivateJobsResponse from
  // Zeebe, that referenced this Task
  seenCount: number

  // The last time at which that happened
  lastSeen: Date

  // The time at which this job as been submitted. Useful to mitigate an incoming but submitted task
  submittedAt: Date
}

// Model the task on what we await from zeebe
export interface TaskI<
  WorkerInputVariables = PhDInputVariables,
  CustomHeaderShape = PhDCustomHeaderShape
  > extends Job<WorkerInputVariables, CustomHeaderShape> {
  journal: TaskJournal
}
