import _ from "lodash"
import React from "react"
import {useFind, useSubscribe} from "meteor/react-meteor-data"
import {Loader} from "@epfl/epfl-sti-react-library";

import {ITaskDashboard} from "../../../policy/dashboard/type";
import {useAccountContext} from "../../contexts/Account";

import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
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

const processInstancesDashboard = new Mongo.Collection('processInstancesDashboard');

export function Dashboard() {
  const account = useAccountContext()

  const listLoading = useSubscribe('tasksDashboardProcessInstance');

  //
  // Filter
  const allTasks = useFind(() => processInstancesDashboard.find())

  //
  // Render
  if (!account?.isLoggedIn) return <Loader message={'Loading your data...'}/>
  if (listLoading()) return <Loader message={'Fetching tasks...'}/>
  if (allTasks.length === 0) return <div>There is currently no task</div>

  return allTasks.map( (processInstance) => <div>
    { JSON.stringify(processInstance.created_at) }
    <hr />
  </div>)
}
