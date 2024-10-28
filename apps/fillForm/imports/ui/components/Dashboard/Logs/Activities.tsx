import React from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import {Step} from "phd-assess-meta/types/dashboards";
import {ActivityLog} from "phd-assess-meta/types/activityLog";


/**
 * List when a step has been completed
 *
 */
export const ActivityCompletedStepInfo = (
  { step, activityLogs }:
    { step: Step, activityLogs: ActivityLog[] }
) => {
  const activityForThisStep = activityLogs.find(
    log => log.elementId === step.id
  )

  return <>
    { activityForThisStep?.completed_at && <div className={ 'activity-log-entry' }>
      <div>
        <FontAwesomeIcon icon={ faCircleCheck } className={ 'activity-log-icon' } />
      </div>
      <div>
        {
          new Date(activityForThisStep.completed_at).toLocaleDateString('fr-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        }
      </div>
    </div>
    }
  </>
}
