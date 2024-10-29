import _ from "lodash";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import {faClockRotateLeft} from "@fortawesome/free-solid-svg-icons";

import {Step} from "phd-assess-meta/types/dashboards";
import {ActivityLog} from "phd-assess-meta/types/activityLog";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";


/**
 * Show current activity status,  from the activity logs, for this step
 *
 */
export const ActivityStatusForStep = (
  { step, activityLogs }:
    { step: Step, activityLogs: ActivityLog[] }
) => {
  const activityForThisStep = activityLogs.find(
    log => log.elementId === step.id
  )

  return <>
    { activityForThisStep?.datetime && <div className={ 'activity-log-entry text-nowrap' }>
      { activityForThisStep.event === 'started' &&
        <FontAwesomeIcon icon={ faClockRotateLeft } className={ 'activity-log-icon' } flip={ 'horizontal' } />
      }
      { activityForThisStep.event === 'completed' &&
        <FontAwesomeIcon icon={ faCircleCheck } className={ 'activity-log-icon' } />
      }
      &nbsp;
      {
        new Date(activityForThisStep.datetime).toLocaleDateString('fr-CH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
    </div>
    }
  </>
}

/**
 * Return the finished date, if available, or
 * else the started date
 */
export const ShowActivityDatePerStep = (
  { definition, workflowInstanceTasks }:
    { definition: DashboardGraph, workflowInstanceTasks: ITaskDashboard[] }
) => {
  return <>
    {
      definition.nodesOrdered().map((node) => {
        const step = definition.node(node) as Step

        // compile all infos that can be found in different tasks into one
        const allActivitiesMerged=_.uniqBy(
          _.flatMap(
            workflowInstanceTasks, task => task.activityLogs
          ), log => `${log.elementId}${log.datetime}`)

        return (
          <div
            className="dashboard-activity-log col text-black text-center"
            key={ `${ workflowInstanceTasks[0]._id }-${ step.id }` }
          >
            <ActivityStatusForStep
              step={ step }
              activityLogs={ allActivitiesMerged }
            />
          </div>
        )
      })
    }
  </>
}
