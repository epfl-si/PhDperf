import React, {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {faPenToSquare} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import {useAccountContext} from "/imports/ui/contexts/Account";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {convertDefinitionToGraph, DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {Step} from "phd-assess-meta/types/dashboards";
import {DashboardRenderedStep} from "/imports/ui/components/Dashboard/Steps";
import {stepsDefinitionDefault} from "/imports/ui/components/DashboardOld/DefaultDefinition";
import {canEditProcessInstance} from "/imports/policy/processInstance";
import {NotificationLogsAsCol} from "/imports/ui/components/Dashboard/Logs";
import {ParticipantsAsTable} from "/imports/ui/components/Participant/List";


const DrawProgress =
  ({workflowInstanceTasks, stepsDefinition}:
     { workflowInstanceTasks: ITaskDashboard[], stepsDefinition: DashboardGraph }) => {
    const firstTask = workflowInstanceTasks[0]
    const taskKey = `${ firstTask?._id }`

    const progressBarDrawn = stepsDefinition.nodesOrdered().reduce((accumulator: JSX.Element[], node: string) => {
      const step: Step = stepsDefinition.node(node)

      return [
        ...accumulator,
        <DashboardRenderedStep
          key={ `${ taskKey }_${ node }` }
          step={ step }
          workflowInstanceTasks={ workflowInstanceTasks }
          stepDefinition={ stepsDefinition }
        />
      ]}, [])

    return <>{ progressBarDrawn }</>
  }

export const DashboardRow = ({ workflowInstanceTasks }: { workflowInstanceTasks: ITaskDashboard[] }) => {
  const account = useAccountContext()

  const [open, setOpen] = useState(false)
  const [canEditInstance, setCanEditInstance] = useState(false)

  const stepsDefinition = workflowInstanceTasks[0].variables.dashboardDefinition ?? stepsDefinitionDefault
  const stepsDefinitionWithoutOldies = stepsDefinition.filter((v: Step) => v.customContent !== "")

  // generate the good dashboard definition for this row
  const definition = useMemo(
    () => convertDefinitionToGraph(stepsDefinitionWithoutOldies),
    [stepsDefinitionWithoutOldies]
  )

  useEffect(() => {
    (async function fetchPermission() {
      setCanEditInstance(await canEditProcessInstance(account!.user!, workflowInstanceTasks[0].processInstanceKey));
    })();
  }, [workflowInstanceTasks[0].processInstanceKey]);

  // find the configuration directly into the bpmn, or use the default
  return <details>
    <summary
      className="dashboard-row-workflow-instance row"
      key={ `${ workflowInstanceTasks[0]._id }_main_div` }
      onClick={ () => setOpen(!open) }
    >
      <div className="dashboard-phdStudentName col-2 text-black"
           key={ `${ workflowInstanceTasks[0]._id }_phdStudentSciper` }>
        <a
          href={ `https://people.epfl.ch/${ workflowInstanceTasks[0].variables.phdStudentSciper }` }
          target={ '_blank' }
        >{ workflowInstanceTasks[0].variables.phdStudentName }</a> ({ workflowInstanceTasks[0].variables.phdStudentSciper })
      </div>
      <div className="dashboard-doctoralProgramName col-1 text-black text-center"
           key={ `${ workflowInstanceTasks[0]._id }_doctoralProgramName` }>
        { workflowInstanceTasks[0].variables.doctoralProgramName }
      </div>
      <div className="dashboard-launched col-1 text-black text-center"
           key={ `${ workflowInstanceTasks[0]._id }_launched` }>
        {
          new Date(workflowInstanceTasks[0].variables.created_at).toLocaleDateString('fr-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
         }
      </div>
      <div className="dashboard-dueDate col-1 text-black text-center"
           key={ `${ workflowInstanceTasks[0]._id }_launched` }>
        { workflowInstanceTasks[0].variables.dueDate }
      </div>
      <div className={ 'dashboard-progress-squares col' }>
        <div className={ 'row' }>
          <DrawProgress
            key={ workflowInstanceTasks[0]._id }
            workflowInstanceTasks={ workflowInstanceTasks }
            stepsDefinition={ definition }
          />
        </div>
      </div>
      <div className={ 'dashboard-action-edit col-1' }>
        { canEditInstance ?
          <Link
            to={ `../workflows/${ workflowInstanceTasks[0].processInstanceKey }` }
          ><FontAwesomeIcon icon={faPenToSquare} />
          </Link> : <span className={ 'ml-3' }>&nbsp;</span>
        }
      </div>
    </summary>
    <div className={ 'dashboard-row-notification-logs row' }>
      <div className={ 'col-2 dashboard-notification-row-placeholder' }></div>
      <div className={ 'col-1 dashboard-notification-row-placeholder' }></div>
      <div className={ 'col-1 dashboard-notification-row-placeholder' }></div>
      <div className={ 'col-1 dashboard-notification-row-placeholder' }></div>
      <div className={ 'col' }>
        <div className={ 'row' }>
          <NotificationLogsAsCol
            key={ `notification-logs-${ workflowInstanceTasks[0]._id }` }
            definition={ definition }
            workflowInstanceTasks={ workflowInstanceTasks }
          />
        </div>
      </div>
      <div className={ 'col-1' }></div>
    </div>
    <div className={ 'dashboard-row-participants row' }>
      <div className={ 'col-2' }></div>
      <div className={ 'col' }>
        <ParticipantsAsTable workflowInstanceTasks={ workflowInstanceTasks } showEmail={ true }/>
      </div>
    </div>
  </details>
}
