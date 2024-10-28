import {Step} from "phd-assess-meta/types/dashboards";
import {NotificationLog} from "phd-assess-meta/types/notification";
import {NotificationLogsListWithIcon} from "/imports/ui/components/Reminder/List";
import React from "react";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEnvelope, faPlus} from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import _ from "lodash";



/**
 * Print follow how many notifications has been sent
 * in the corresponding step. You may add the start reminder button with canStartReminder = true
 */
export const NotificationsCount = (
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

  const notificationLogsForThisStep = allNotificationMerged.filter(
    // count the normal and the reminders
    (log: NotificationLog) =>
      (log.fromElementId === step.id || log.fromElementId === step.id + '_reminder')
  ) ?? []

  return <div className={
    `notification-log-step-count${ canStartReminder ? ' notification-log-step-count-with-plus-button' : '' }`
  }>
    <span className={ 'notification-log-step-count-number' }>
      { notificationLogsForThisStep.length }
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

export const NotificationLogsList = (
  { step, notificationLogs }:
    { step: Step, notificationLogs: NotificationLog[] }
) => {

  const currentStepNotificationLogs = notificationLogs.filter(
    (log: NotificationLog) => log.sentAt && ( log.fromElementId === step.id || log.fromElementId === step.id + '_reminder' )
  )

  return <div className={ `notification-log-step-${ step.id }` }>
    { currentStepNotificationLogs ?
      <NotificationLogsListWithIcon logs={ currentStepNotificationLogs }/> :
      <span>&nbsp;</span>
    }
  </div>
}
