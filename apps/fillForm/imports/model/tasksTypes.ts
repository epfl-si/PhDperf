import {IInputVariables, Job} from "zeebe-node";
import {PhDAssessVariables} from "phd-assess-meta/types/variables";
import {PhDCustomHeaderShape} from "phd-assess-meta/types/fillForm/headers";
import {Sciper} from "phd-assess-meta/types/participants";


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

// These are the bpmn variables we could find for every step, and
// we will need through the code. Here we add the assigneeSciper, that
// can come from different sources. But we only want into this variable at the end.
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
