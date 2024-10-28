/**
 * Put Notification logs (from activity logs, reminders) into the dashboard
 */

import _ from "lodash";
import React from "react";

import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {Step} from "phd-assess-meta/types/dashboards";
import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {ActivityCompletedStepInfo} from "/imports/ui/components/Dashboard/Logs/Activities";
import {NotificationLogsList} from "/imports/ui/components/Dashboard/Logs/Notifications";


export const ListLogsInColumn = (
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

        const allActivitiesMerged=_.uniqBy(
          _.flatMap(
            workflowInstanceTasks, task => task.activityLogs
          ), log => `${log.elementId}${log.completed_at}`)

        return (
          <div
            className="dashboard-notification-log col text-black"
            key={ `${ workflowInstanceTasks[0]._id }-${ step.id }` }
          >
            <ActivityCompletedStepInfo
              step={ step }
              activityLogs={ allActivitiesMerged }
            />
            <NotificationLogsList
              step={ step }
              notificationLogs={ allNotificationMerged }
            />
          </div>
        )
      })
    }
  </>
}
