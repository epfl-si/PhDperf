import {useTracker} from "meteor/react-meteor-data"
import {Meteor} from "meteor/meteor"
import {Tasks} from "../../../model/tasks";
import _ from "lodash"
import React, {CSSProperties} from "react"
import {Loader} from "@epfl/epfl-sti-react-library";
import {ITaskDashboard} from "../../../policy/dashboard/type";
import {useAccountContext} from "../../contexts/Account";
import {
  stepsDefinitionDefault,
} from "./DefaultDefinition";
import {Step} from "phd-assess-meta/types/dashboards";
import {DashboardRenderedStep} from "/imports/ui/components/Dashboard/Steps";
import {convertDefinitionToGraph, DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";


const DrawProgress =
  ({workflowInstanceTasks, stepsDefinition}:
     { workflowInstanceTasks: ITaskDashboard[], stepsDefinition: DashboardGraph }) => {
  const firstTask = workflowInstanceTasks[0]
  const taskKey = `${ firstTask?._id }`

  const progressBarDrawn = stepsDefinition.nodes().reduce((accumulator: JSX.Element[], node: string) => {
    const step: Step = stepsDefinition.node(node)

    // nodes without step data are certainly the aliases. Pass it
    if (!step) return accumulator

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

export const DashboardRow = ({ workflowInstanceTasks } : { workflowInstanceTasks:ITaskDashboard[] }) => {
  // generate the good dashboard definition for this row
  const definition: DashboardGraph = convertDefinitionToGraph(
    workflowInstanceTasks[0].variables.dashboardDefinition ?? stepsDefinitionDefault
  )

  // find the configuration directly into the bpmn, or use the default
  return <div className="row" key={ `${workflowInstanceTasks[0]._id}_main_div` }>
    <div className="dashboard-phdStudentName col-2 m-1 p-2 text-black" key={ `${workflowInstanceTasks[0]._id}_phdStudentSciper` } >
      <a
        href={`https://people.epfl.ch/${workflowInstanceTasks[0].variables.phdStudentSciper}`}
        target={'_blank'}
      >{ workflowInstanceTasks[0].variables.phdStudentName }</a> ({ workflowInstanceTasks[0].variables.phdStudentSciper })
    </div>
    <div className="dashboard-doctoralProgramName col m-1 p-2 text-black" key={ `${workflowInstanceTasks[0]._id}_doctoralProgramName` } >
      { workflowInstanceTasks[0].variables.doctoralProgramName }
    </div>
    <DrawProgress
      key={ workflowInstanceTasks[0]._id }
      workflowInstanceTasks={ workflowInstanceTasks }
      stepsDefinition={ definition }
    />
  </div>
}

const DashboardHeader = ({ definition, headerKey }: { definition: DashboardGraph, headerKey: string }) => {
  const backgroundColor: CSSProperties = Meteor.settings.public.isTest ? { backgroundColor: 'Cornsilk' } : {}

  return (
    <div
      className="dashboard-title row flex-nowrap sticky-top"
      key={ `dashboard_title_row` }
      style={ backgroundColor ?? {} }
    >
      <div className="dashboard-header dashboard-header-phdStudentName col-2 m-1 p-2 text-black align-self-end">
        Name
      </div>
      <div className="dashboard-header dashboard-header-doctoralProgramName col m-1 p-2 text-black align-self-end">
        Program
      </div>
      {
        // using the default configuration here, as it match for all versions at the moment.
        definition.nodes().map((node) => {
          const step = definition.node(node) as Step

          return <div
            className="dashboard-header col m-1 p-2 text-black align-self-end text-small"
            key={ `${ headerKey}-${ step.id }` }
          >{ step.label }</div>
        })
      }
    </div>
  )
}

export const DashboardContent = ({ definitionForHeader, tasks, headerKey }: {
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
    <div className="container small dashboard">
      <DashboardHeader key={ `header_${ headerKey }`} definition={ definitionForHeader } headerKey={ headerKey }/>
      {
        Object.keys(groupByWorkflowInstanceTasks).map(
          (taskGrouper: string) => <DashboardRow
            key={ taskGrouper }
            workflowInstanceTasks={ groupByWorkflowInstanceTasks[taskGrouper] }
          />
        )
      }
    </div>
  )
}

export function Dashboard() {
  const account = useAccountContext()

  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasksDashboard');
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
