import React from "react";
import {useTracker} from "meteor/react-meteor-data";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import {faEnvelope} from "@fortawesome/free-regular-svg-icons";

import {Step} from "phd-assess-meta/types/dashboards";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {ReminderLog, ReminderLogs} from "/imports/api/reminderLogs/schema";


/**
 * Print follow how many notifications has been sent
 * in the corresponding step. You may add the start reminder button with canStartReminder = true
 */
export const RemindersCount = (
  { step, workflowInstanceTasks, canStartReminder }: {
    step: Step,
    workflowInstanceTasks: ITaskDashboard[],
    canStartReminder: boolean
  }) => {
  // Filter
  let remindersLogs = useTracker(() => ReminderLogs.find(
    { _id: workflowInstanceTasks[0]?.processInstanceKey }
  ).fetch(), [workflowInstanceTasks])

  const allCurrentStepIds = [
    step.id,
    ...( step.knownAs ?? [] )
  ]

  const currentTask = workflowInstanceTasks.findLast(
    task => allCurrentStepIds.includes(task.elementId)
  )

  // get the interesting logs only
  const reminders = remindersLogs.flatMap(
    log => log.logs
  ).filter(
    log => allCurrentStepIds.includes(log.elementId)
  )

  return <div className={
    `notification-log-step-count${ canStartReminder ? ' notification-log-step-count-with-plus-button' : '' }`
  }>
    <span className={ 'notification-log-step-count-number' }>
      { reminders.length }
    </span>
    <span className={ 'notification-log-step-count-envelope text-white' }>
      <FontAwesomeIcon icon={ faEnvelope } />
    </span>
    { currentTask && canStartReminder &&
      <FontAwesomeIcon icon={ faPlus } border className={'notification-log-step-plus'}/>
    }
  </div>
}

export const ReminderLogsList = (
  { processInstanceKey, step }:
    { processInstanceKey: string, step: Step }
) => {
  // Filter
  let remindersLogs = useTracker(() => ReminderLogs.find(
    { _id: processInstanceKey }
  ).fetch(), [processInstanceKey])

  const allCurrentStepIds = [
    step.id,
    ...( step.knownAs ?? [] )
  ]

  // get the interesting logs only
  const reminders = remindersLogs.flatMap(
    log => log.logs
  ).filter(
    log => allCurrentStepIds.includes(log.elementId)
  )

  return <div
    key={ `notification-log-step-${ step.id }-${ processInstanceKey }` }
  >
    { reminders ?
      <ReminderLogsListWithIcon
        processInstanceKey={ processInstanceKey }
        logs={ reminders }
      /> :
      <span>&nbsp;</span>
    }
  </div>
}

/**
 * List reminders sent
 *
 */
const ReminderLogsListWithIcon = (
  { processInstanceKey, logs }: {
    processInstanceKey: string, logs: ReminderLog[]
  }
) => {
  return <>
    { logs
      .sort(
        (a,b) => {
          return new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        })
      .map((log) => <>
          { log.datetime && <div
            className={ 'notification-log-entry text-nowrap'}
            key={ `notification-log-entry-${ processInstanceKey }-${ log.elementId }-${ log.datetime }` }
          >
            <FontAwesomeIcon
              icon={ faEnvelope }
              className={ 'notification-log-entry-envelope' }
            />
            &nbsp;
            { new Date(log.datetime).toLocaleDateString('fr-CH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) }
          </div> }
        </>
      )}
  </>
}

export const ListRemindersInColumn = (
  { definition, workflowInstanceTasks }:
    { definition: DashboardGraph, workflowInstanceTasks: ITaskDashboard[] }
) => {

  return <>
    {
      definition.nodesOrdered().map((node) => {
        const step = definition.node(node) as Step

        return (
          <div
            className="dashboard-notification-log col text-black text-center"
            key={ `${ workflowInstanceTasks[0]._id }-${ step.id }` }
          >
            <ReminderLogsList
              processInstanceKey={ workflowInstanceTasks[0].processInstanceKey }
              step={ step }
            />
          </div>
        )
      })
    }
  </>
}
