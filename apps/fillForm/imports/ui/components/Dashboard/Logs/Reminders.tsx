import {Step} from "phd-assess-meta/types/dashboards";
import {NotificationLog} from "phd-assess-meta/types/notification";
import React from "react";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import {faEnvelope} from "@fortawesome/free-regular-svg-icons";
import {Link} from "react-router-dom";
import _ from "lodash";
import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";



/**
 * Print follow how many notifications has been sent
 * in the corresponding step. You may add the start reminder button with canStartReminder = true
 */
export const RemindersCount = (
  { step, task, workflowInstanceTasks, canStartReminder }: {
    step: Step,
    task: ITaskDashboard,
    workflowInstanceTasks: ITaskDashboard[],
    canStartReminder: boolean
  }) => {

  // compile all infos that can be found in different tasks into one
  const allNotificationMerged=_.uniqBy(
    _.flatMap(
      workflowInstanceTasks, task => task.notificationLogs
    ), log => `${log.sentAt}${log.fromElementId}${log.type ?? 'awaitingForm'}`)

  const reminderLogsForThisStep = allNotificationMerged.filter(
    // count the normal and the reminders
    (log: NotificationLog) =>
      ( log.fromElementId === step.id + '_reminder' || (
        log.fromElementId === step.id && log.type === 'reminder'
      ))
  ) ?? []

  return <div className={
    `notification-log-step-count${ canStartReminder ? ' notification-log-step-count-with-plus-button' : '' }`
  }>
    <span className={ 'notification-log-step-count-number' }>
      { reminderLogsForThisStep.length }
    </span>
    <span className={ 'notification-log-step-count-envelope text-white' }>
      <FontAwesomeIcon icon={ faEnvelope } />
    </span>
    { canStartReminder &&
      <Link to={ `/tasks/${ task._id }/reminders/create` } className={ 'text-white' }>
        <FontAwesomeIcon icon={ faPlus } border className={'notification-log-step-plus'}/>
      </Link>
    }
  </div>
}

export const ReminderLogsList = (
  { step, notificationLogs }:
    { step: Step, notificationLogs: NotificationLog[] }
) => {

  const currentStepNotificationLogs = notificationLogs.filter(
    (log: NotificationLog) => log.sentAt &&
      ( log.fromElementId === step.id + '_reminder' || (
        ( log.fromElementId === step.id && log.type === 'reminder' )
      ))
  )

  return <div className={ `notification-log-step-${ step.id }` }>
    { currentStepNotificationLogs ?
      <ReminderLogsListWithIcon logs={ currentStepNotificationLogs }/> :
      <span>&nbsp;</span>
    }
  </div>
}

/**
 * List reminders sent
 *
 */
const ReminderLogsListWithIcon = ({ logs }: { logs: NotificationLog[] }) => {
  return <>
    { logs
      .sort(
        (a,b) => {
          return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        })
      .map((log) => <>
          { log.sentAt && <div className={ 'notification-log-entry text-nowrap'}>
            <FontAwesomeIcon icon={ faEnvelope } className={ 'notification-log-entry-envelope' } />
            &nbsp;
            { new Date(log.sentAt).toLocaleDateString('fr-CH', {
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

        // compile all infos that can be found in different tasks into one
        const allNotificationMerged=_.uniqBy(
          _.flatMap(
            workflowInstanceTasks, task => task.notificationLogs
          ), log => `${log.sentAt}${log.fromElementId}${log.type ?? 'awaitingForm'}`)

        return (
          <div
            className="dashboard-notification-log col text-black text-center"
            key={ `${ workflowInstanceTasks[0]._id }-${ step.id }` }
          >
            <ReminderLogsList
              step={ step }
              notificationLogs={ allNotificationMerged }
            />
          </div>
        )
      })
    }
  </>
}
