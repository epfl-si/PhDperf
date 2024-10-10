/**
 * This is a copy of the dashboard, as a snapshot, so we can freely change the new one.
 * This will serve only old workflows, identied by the fact they don't have an uuid.
 *
 * Main diff with the new dashboard:
 * - no edit workflow link
 *
 */
import {useAccountContext} from "/imports/ui/contexts/Account";
import {useTracker} from "meteor/react-meteor-data";
import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {Loader} from "@epfl/epfl-sti-react-library";
import {convertDefinitionToGraph, DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {stepsDefinitionDefault} from "/imports/ui/components/DashboardOld/DefaultDefinition";
import React, {CSSProperties, useMemo, useState} from "react";
import {Step} from "phd-assess-meta/types/dashboards";
import {DashboardRenderedStepOld} from "/imports/ui/components/DashboardOld/StepsOld";
import {ParticipantsAsTable} from "/imports/ui/components/Participant/List";
import _ from "lodash";


const DrawProgress =
  ({workflowInstanceTasks, stepsDefinition}:
     { workflowInstanceTasks: ITaskDashboard[], stepsDefinition: DashboardGraph }) => {
    const firstTask = workflowInstanceTasks[0]
    const taskKey = `${ firstTask?._id }`

    const progressBarDrawn = stepsDefinition.nodesOrdered().reduce((accumulator: JSX.Element[], node: string) => {
      const step: Step = stepsDefinition.node(node)

      return [
        ...accumulator,
        <DashboardRenderedStepOld
          key={ `${ taskKey }_${ node }` }
          step={ step }
          workflowInstanceTasks={ workflowInstanceTasks }
          stepDefinition={ stepsDefinition }
        />
      ]}, [])

    return <>{ progressBarDrawn }</>
  }

const DashboardRow = ({ workflowInstanceTasks }: { workflowInstanceTasks: ITaskDashboard[] }) => {

  const [open, setOpen] = useState(false)

  const stepsDefinition = workflowInstanceTasks[0].variables.dashboardDefinition ?? stepsDefinitionDefault

  // generate the good dashboard definition for this row
  const definition = useMemo(
    () => convertDefinitionToGraph(stepsDefinition),
    [stepsDefinition]
  )

  // find the configuration directly into the bpmn, or use the default
  return <details>
    <summary
      className="row"
      key={ `${ workflowInstanceTasks[0]._id }_main_div` }
      onClick={ () => setOpen(!open) }
    >
      <div className="old-dashboard-phdStudentName col-2 m-1 ml-2 p-2 text-black" key={ `${ workflowInstanceTasks[0]._id }_phdStudentSciper` }>
        <a
          href={ `https://people.epfl.ch/${ workflowInstanceTasks[0].variables.phdStudentSciper }` }
          target={ '_blank' }
        >{ workflowInstanceTasks[0].variables.phdStudentName }</a> ({ workflowInstanceTasks[0].variables.phdStudentSciper })
      </div>
      <div className="old-dashboard-doctoralProgramName col m-1 p-2 text-black" key={ `${ workflowInstanceTasks[0]._id }_doctoralProgramName` }>
        { workflowInstanceTasks[0].variables.doctoralProgramName }
      </div>
      <DrawProgress
        key={ workflowInstanceTasks[0]._id }
        workflowInstanceTasks={ workflowInstanceTasks }
        stepsDefinition={ definition }
      />
      <span className={ 'ml-3' }>&nbsp;</span>
    </summary>
    <div className={ 'row' }>
      <div className={ 'col-2' }></div>
      <div className={ 'col' }>
        <ParticipantsAsTable workflowInstanceTasks={ workflowInstanceTasks } showEmail={ true }/>
      </div>
    </div>
  </details>
}

const DashboardHeader = ({ definition, headerKey }: { definition: DashboardGraph, headerKey: string }) => {
  const backgroundColor: CSSProperties = Meteor.settings.public.isTest && !Meteor.settings.public.ignoreTestBackgroundColor ? { backgroundColor: 'Cornsilk' } : { backgroundColor: 'white' }

  return (
    <div
      className="old-dashboard-title row flex-nowrap sticky-top"
      key={ `dashboard_title_row` }
      style={ backgroundColor ?? {} }
    >
      <div className="old-dashboard-header old-dashboard-header-phdStudentName col-2 m-1 p-2 text-black align-self-end">
        Name
      </div>
      <div className="old-dashboard-header old-dashboard-header-doctoralProgramName col m-1 p-2 text-black align-self-end">
        Program
      </div>
      {
        definition.nodesOrdered().map((node) => {
          const step = definition.node(node) as Step

          return <div
            className="old-dashboard-header col m-1 p-2 text-black align-self-end text-small"
            key={ `${ headerKey }-${ step.id }` }
          >{ step.label }</div>
        })
      }
      {/*additional div for the edit link*/}
      <div className={'pl-4'}>&nbsp;</div>
    </div>

  )
}

const DashboardContent = ({ definitionForHeader, tasks, headerKey }: {
  definitionForHeader: DashboardGraph, tasks: ITaskDashboard[], headerKey: string
}) => {
  //
  // Sort
  tasks = _.sortBy(
    tasks,
    [
      function(task: ITaskDashboard) {
        const doctoralSchool = task.variables.doctoralProgramName
        if (task.variables?.phdStudentEmail) {
          // sort by second part of email address, that's the best way to get the name at this point
          return `${doctoralSchool}${_.split(task.variables?.phdStudentEmail, '.')[1]}`
        } else {
          return `${doctoralSchool}`
        }
      }]
  )

  //
  // Group_by
  // here we can get multiple task for the same process instance, meaning it have multiple job awaiting
  const groupByWorkflowInstanceTasks = _.groupBy(tasks, 'processInstanceKey')

  return (
    <div className="container small old-dashboard">
      <DashboardHeader key={ `header_${ headerKey }`} definition={ definitionForHeader } headerKey={ headerKey }/>
      {
        Object.keys(groupByWorkflowInstanceTasks).map(
          (tasksGrouper: string) => <DashboardRow
            key={ tasksGrouper }
            workflowInstanceTasks={ groupByWorkflowInstanceTasks[tasksGrouper] }
          />
        )
      }
    </div>
  )
}

export function DashboardOld() {
  const account = useAccountContext()

  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasksDashboardOld');
    return !handle.ready();
  }, []);

  //
  // Filter
  let allTasks = useTracker(() => Tasks.find(
    {"elementId": {$ne: "Activity_Program_Assistant_Assigns_Participants"}}  // ignore first step
  ).fetch() as ITaskDashboard[])

  //
  // Render
  if (!account?.isLoggedIn) return <Loader message={'Loading your data...'}/>
  if (listLoading) return <Loader message={'Fetching tasks...'}/>
  if (allTasks.length === 0) return <div>There is currently no task</div>

  // having a graph for the dashboard definition is easier to process
  const definitionGraph = convertDefinitionToGraph(stepsDefinitionDefault)
  // use the name of the variable as key
  const definitionKey = Object.keys({StepsDefinitionDefault: stepsDefinitionDefault})[0]

  return (
    <DashboardContent
      key={ definitionKey }
      headerKey={ definitionKey }  // propage the key
      definitionForHeader={ definitionGraph }
      tasks={ allTasks }
    />
  )
}
