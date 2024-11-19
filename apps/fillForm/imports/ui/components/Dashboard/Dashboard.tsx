import _ from "lodash"
import {Meteor} from "meteor/meteor"
import React from "react"
import {useTracker} from "meteor/react-meteor-data"
import {Loader} from "@epfl/epfl-sti-react-library";

import {Tasks} from "../../../model/tasks";
import {ITaskDashboard} from "../../../policy/dashboard/type";
import {useAccountContext} from "../../contexts/Account";
import {
  stepsDefinitionDefault,
} from "../DashboardOld/DefaultDefinition";
import {convertDefinitionToGraph, DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import { DashboardHeader } from "./Header";
import { DashboardRow } from "./Row";


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
          (tasksGrouper: string) => <DashboardRow
            key={ tasksGrouper }
            workflowInstanceTasks={ groupByWorkflowInstanceTasks[tasksGrouper] }
          />
        )
      }
    </div>
  )
}

export function Dashboard() {
  const account = useAccountContext()

  const listTasksLoading = useTracker(() => {
    const handle = Meteor.subscribe('tasksDashboard');
    return !handle.ready();
  }, []);

  //
  // Filter
  let allTasks = useTracker(() => Tasks.find(
    {"elementId": {$ne: "Activity_Program_Assistant_Assigns_Participants"}}  // ignore first step
  ).fetch() as unknown as ITaskDashboard[])

  //
  // Render
  if (!account?.isLoggedIn) return <Loader message={'Loading your data...'}/>
  if (listTasksLoading) return <Loader message={'Fetching tasks...'}/>
  if (allTasks.length === 0) return <div>There is currently no task</div>

  // having a graph for the dashboard definition is easier to process
  const definitionGraph = convertDefinitionToGraph(allTasks[0].variables.dashboardDefinition)
  // use the name of the variable as key
  const definitionKey = Object.keys({StepsDefinitionDefault: stepsDefinitionDefault})[0]

  if (!definitionGraph) return <></>

  return (
    <DashboardContent
      key={ definitionKey }
      headerKey={ definitionKey }  // propage the key
      definitionForHeader={ definitionGraph }
      tasks={ allTasks }
    />
  )
}
