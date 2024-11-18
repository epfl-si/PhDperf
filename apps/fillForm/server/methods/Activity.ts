import dayjs from "dayjs";
import {encrypt} from "/server/encryption";

import {ActivityLog} from "phd-assess-meta/types/activityLog";
import {Task, Tasks} from "/imports/model/tasks";
import WorkersClient from "/server/zeebe_broker_connector";

const debug = require('debug')('server/methods/Activity')


/**
 * Add a new started event in activityLogs
 */
const bumpActivityLogStartedOnLocalDB = (task: Task, startDate: Date) => {
  // Create the activity
  const startedActivityLog: string = JSON.stringify( {
    event: 'started',
    datetime: startDate.toJSON(),
    elementId: task.elementId
  } as ActivityLog )

  // bump the task locally
  Tasks.update(
    { _id: task.key },
    { $push: {
        'variables.activityLogs': startedActivityLog
      }}
  )
  debug(`Started event added to task`)
}

/**
 * Add a new started event in activityLogs on Zeebe
 */
const bumpZeebeActivityLogsFromLocalDB = (task: Task,) => {

  const cTask = Tasks.findOne( { _id: task._id })  // fetch last values

  const encryptedVariables = cTask?.variables.activityLogs?.map(log => encrypt(log));

  if (encryptedVariables) {
    ( async () => {
      await WorkersClient.setVariables(
        task.elementInstanceKey,
        {
          activityLogs: encryptedVariables
        },
        true  // prevent moving the values into the process instance scope,
        // as the value is already set, process instance wise
      )
    })();

    debug(`Zeebe service task ${task.elementInstanceKey} bumped the activityLogs to add the started event.`)
  }
}

/**
 * Update, if needed, task and sibling tasks about this activity in local DB and zeebe,
 * as the info will disappear once the task is successful.
 */
export const normalizeTaskActivityLogsForStartedEvent = (
  taskKey: string
) => {
  debug(`Asserting 'started' activityLog is correctly set`)

  const task = Tasks.findOne({ _id: taskKey })

  if (!task) return

  const hasStartedEventForCurrentStep = task.activityLogs?.filter(
    log => log.elementId === task.elementId && log.event === 'started'
  ).length > 0

  if ( !hasStartedEventForCurrentStep ) {
    debug(`Missing started event, bumping it...`)
    const startedDate = dayjs().toDate()

    bumpActivityLogStartedOnLocalDB(task, startedDate)
    // bump the siblings too, as the keep the trace of the task once the task is over
    task.siblings?.forEach( ( siblingTask: Task ) => {
      bumpActivityLogStartedOnLocalDB(siblingTask, startedDate)
      debug(`a sibling has been bumped for a started event in db for task ${task.elementId}`)
    })

    // bump everything in Zeebe now
    bumpZeebeActivityLogsFromLocalDB(task)
    // bump the siblings too, as the keep the trace of the task once the task is over and removed
    task.siblings?.forEach( ( siblingTask: Task ) => {
      bumpZeebeActivityLogsFromLocalDB(siblingTask)
      debug(`a sibling has been bumped for a started event in db for task ${task.elementId}`)
    })
  }
}

/**
 * Update sibling tasks about this activity in local DB,
 * as the info will disappear once the task is successful
 */
export const bumpActivityLogsAfterSubmittedTask = async (
  submittedTask: Task,
  activityLog: ActivityLog,
) => {

  const siblings = await submittedTask.siblings.fetchAsync()

  if (siblings.length > 0) {
    debug(
      `Bumping the activity logs of the task siblings, 
    on Zeebe and on the local db, 
    as the task has been submitted. 
    Bumping with: ${JSON.stringify(activityLog)}...`
    )

    for (const task of siblings) {
      // locally
      await Tasks.updateAsync(
        { _id: task.key },
        { $push: {
            'variables.activityLogs': JSON.stringify(activityLog)
          }}
      )

      // on the zeebe service task
      const encryptedVariables = task.variables.activityLogs?.map(log => encrypt(log))
      await WorkersClient.setVariables(
        task.elementInstanceKey,
        {
          activityLogs: encryptedVariables
        },
        true  // prevent moving the values into the process instance scope,
        // as the value is already set, process instance wise
      )
      debug(`Zeebe service task ${task.elementInstanceKey} bumped as a sibling ${submittedTask.key} has concluded.`)
    }
  }
}
