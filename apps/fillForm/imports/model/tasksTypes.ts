import {ICustomHeaders, IInputVariables, Job} from "zeebe-node";
import {Sciper} from "../api/datatypes";
import {PhDAssessVariables} from "phd-assess-meta/types/variables";

export class PhDCustomHeaderShape implements ICustomHeaders {
  groups?: string[]  // manage permission groupwise
  title?: string  // title shown for this task
  formIO?: string  // the formIO JSON
  [key: string]: any  // the others var
}

// What the FormIO metadata provides us with
export interface FormioActivityLog {
  timezone?: string;
  offset?: number;
  origin?: string;
  referrer?: string;
  browserName?: string;
  userAgent?: string;
  pathName?: string;  // the only one we are interested in
  onLine?: boolean;
}

// This are the bpmn variables we could find for every steps and
// we will need through the code.
// Why a class instead an interface here ? To be able to read the
// keys later in the process. See https://stackoverflow.com/a/59806829
export interface PhDInputVariables extends PhDAssessVariables, IInputVariables {
  assigneeSciper?: Sciper | Sciper[]
  //[key: string]: any  // the others var
}

export type TaskJournal = {
  // The number of times we received an ActivateJobsResponse from
  // Zeebe, that referenced this Task
  seenCount?: number
  lastSeen?: Date    // The last time at which that happened
  submittedAt?: Date
}

// Model the task on what we await from zeebe
export interface TaskInterface<
    WorkerInputVariables = Partial<PhDInputVariables>,
    CustomHeaderShape = PhDCustomHeaderShape
  > extends Job<
  Partial<WorkerInputVariables>, CustomHeaderShape
  > {
    journal: TaskJournal
  }
