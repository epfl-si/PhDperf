import _ from "lodash";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import {faClockRotateLeft} from "@fortawesome/free-solid-svg-icons";

import {Step} from "phd-assess-meta/types/dashboards";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {ActivityLog} from "/imports/api/activityLogs/schema";


/**
 * Show current activity status,  from the activity logs, for this step
 *
 */
export const ActivityStatusForStep = (
  { step, activityLogs }:
    { step: Step, activityLogs: ActivityLog[] }
) => {

  const idsToFind = [
    step.id,
    ...( step.knownAs ?? [] ),
  ]

  const activityCompletedForThisStep = _.findLast(
    activityLogs, ( log ) =>
      log.event === 'completed' && idsToFind.includes(log.elementId)
  )

  const activityStartedForThisStep = _.findLast(
    activityLogs, ( log ) =>
      log.event === 'started' && idsToFind.includes(log.elementId)
  )

  // priority to completed step
  const currentActivity = activityCompletedForThisStep ?
    activityCompletedForThisStep : activityStartedForThisStep

  return <div className={ 'activity-log-entry text-nowrap' }>
    { activityCompletedForThisStep ?
      <FontAwesomeIcon
        icon={ faCircleCheck }
        className={ 'activity-log-icon' }
      /> :
      activityStartedForThisStep &&
        <FontAwesomeIcon
          icon={ faClockRotateLeft }
          className={ 'activity-log-icon' }
          flip={ 'horizontal' }
        />
    }
    &nbsp;
    {
      currentActivity?.datetime &&
        new Date(currentActivity.datetime).toLocaleDateString('fr-CH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
    }
  </div>
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

        // compile all activityLogs that can be found in different tasks into one
        const allActivitiesMerged = _.uniqBy(
          _.flatMap(
            workflowInstanceTasks,
            task => task.activityLogs ?? []
          ),
          log => `${ log.event }${ log.elementId }`
        )

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
