/**
 * Everything that go from zeebe app to this app
 */

import {
  Job,
  IOutputVariables,
  JobCompletionInterface,
} from "zeebe-node"

import {decrypt} from "/server/encryption";
import {PhDCustomHeaderShape} from "phd-assess-meta/types/fillForm/headers";
import {PhDInputVariables} from "/imports/model/tasksTypes";
import {Task, Tasks} from "/imports/model/tasks";
import {fixFirstLastName} from "/server/zeebe/fixer";

import debug_ from "debug";
import {auditLogConsoleOut} from "/imports/lib/logging";
const debug = debug_('phd-assess:zeebe:in')
const auditLog = auditLogConsoleOut.extend('server/zeebe/in')


// redeclare what is a job in the PhD context
export interface PhDZeebeJob<
  WorkerInputVariables = PhDInputVariables,
  CustomHeaderShape = PhDCustomHeaderShape,
  WorkerOutputVariables = IOutputVariables> extends Job<WorkerInputVariables, CustomHeaderShape>,
  JobCompletionInterface<WorkerOutputVariables> {
}

// list which variables are not encrypted.
const alreadyDecryptedVariables = [
  'dashboardDefinition',
  'uuid',
  'notifySubject',
  'notifyMessage',
]

export type decryptedVariablesRaw = {
  [ key: string ]:
    string |
    null |
    ( string | null )[]
}

export function zeebeJobToTask(job: PhDZeebeJob): Task {
  // decrypt the variables before saving into memory
  let decryptedVariables: decryptedVariablesRaw = {}

  let undecryptableVariablesKey: string[] = []

  Object.keys(job.variables).map((key) => {
    try {
      if ( alreadyDecryptedVariables.includes(key) ) {
        decryptedVariables[key] = job.variables[key]
      } else if ( Array.isArray(job.variables[key]) ) {
        decryptedVariables[key] = job.variables[key].reduce(
          (acc: ( string | null )[], item: string | null) => {
            // forget null values, it provides nothing in our current setup
            if (item != null) {
              const decryptedItem = decrypt(item)
              acc.push(decryptedItem)
            }
            return acc
          }, [])
      } else {
        const decryptedItem = decrypt(job.variables[key])
        // forget null values, it provides nothing in our current setup
        if (decryptedItem != null) decryptedVariables[key] = decryptedItem
      }
    } catch (error) {
      undecryptableVariablesKey.push(key)
    }
  })

  if (undecryptableVariablesKey.length > 0) {
    // not good, some values are not readable.
    const cantDecryptError = new Error(`Error: Some fields are undecryptable. Fields : ${JSON.stringify(undecryptableVariablesKey)}`)
    debug(`Can't decrypt one or more key: ${JSON.stringify(undecryptableVariablesKey)}`)
    throw cantDecryptError
  }

  // manage the special case of assignees scipers. They can come, historically, as a variable or as field designator
  // the field designator is the moderne way to get the flexibility to refresh a job when a participant has been changed
  if (job.customHeaders.assigneeSciperFieldName) {
    //TODO: move this into ./zeebe/fixer.ts
    const fieldsName = []
    const scipers: string[] = []

    if (job.customHeaders.assigneeSciperFieldName.includes(',')) {
      job.customHeaders.assigneeSciperFieldName.split(',').forEach(f => fieldsName.push(f?.trim()))
    } else {
      fieldsName.push(job.customHeaders.assigneeSciperFieldName.trim())
    }

    // get the value for each field
    fieldsName.forEach(field =>
        decryptedVariables[field] && scipers.push(
          // this one are guaranteed to be string, not null or array
          decryptedVariables[field] as string
        )
    )

    decryptedVariables.assigneeSciper = scipers
  }

  // Curate first and last name from "websrv" times
  decryptedVariables = fixFirstLastName(decryptedVariables)

  // we are ok to make it to a task now
  const task = job as unknown as Task
  task._id = job.key
  task.variables = decryptedVariables as PhDInputVariables

  return task
}

export enum PersistOutcome {
  NEW = 1,
  ALREADY_KNOWN = 2,
  ALREADY_SUBMITTED = 3,
}

/**
 * Save `job` into `to_collection`.
 *
 * Insight: A return value of `PersistOutcome.ALREADY_KNOWN` occurs quite a
 * lot, since Zeebe's entire architecture basically believes that all
 * jobs should be performed promptly, whereas we are asking humans to
 * fill out forms.
 *
 * This is a Fiber'd function i.e. it may perform async work
 * “transparently” (without using async / await)
 *
 * @returns `PersistOutcome.NEW` if we see this job for the very first time
 * @returns `PersistOutcome.ALREADY_KNOWN` if we already had this job in store
 * @returns `PersistOutcome.ALREADY_SUBMITTED` if the job is new but was marked as submitted. It can happen
 *           if we are pulling some batch data that takes time while the job is being submitted
 */
export function persistJob (job: PhDZeebeJob) : PersistOutcome {
  let status : PersistOutcome

  // assert before inserting that this task is not already submitted
  if (Tasks.find({ _id: job.key, 'journal.submittedAt': { $exists:true } }).count() !== 0) {
    auditLog(`Refusing to add this task ( job key: ${job.key}, process instance : ${job.processInstanceKey} ) to meteor, as it was flagged as already submitted`)
    return PersistOutcome.ALREADY_SUBMITTED
  }

  const task = zeebeJobToTask(job)
  const taskExistAlready = ( Tasks.find({ _id: job.key }).count() !== 0 )
  let taskId: string;  // keep a log of the created/updated id

  if ( !taskExistAlready ) {
    // a new task, insert all data, with journaling set
    taskId = Tasks.insert({
        ...{
          journal: {
            lastSeen: new Date(),
            seenCount: 1
          }},
        ...task
      } as Task
    )
  } else {
    // updating the existing for the up-to-date values
    Tasks.update(job.key, {
      $inc: { "journal.seenCount": 1 },
      $set: {
        "journal.lastSeen": new Date(),
        "variables.notificationLogs": task.variables.notificationLogs,
      },
    })
    taskId = job.key
  }

  if ( !taskExistAlready ) {
    debug(`Received a new job from Zeebe ${ taskId }`)
    status = PersistOutcome.NEW
  } else {
    status = PersistOutcome.ALREADY_KNOWN
  }

  return status
}
