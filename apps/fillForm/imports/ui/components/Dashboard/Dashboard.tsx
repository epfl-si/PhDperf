import _ from "lodash"
import {Meteor} from "meteor/meteor"
import React, {useState} from "react"
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
import SortSpecifier = Mongo.SortSpecifier;


export const DashboardContent = (
  { definitionForHeader, tasks, headerKey, setSorting }: {
    definitionForHeader: DashboardGraph,
    tasks: ITaskDashboard[],
    headerKey: string,
    setSorting: ( sortSpecifier: SortSpecifier ) => void
  }) => {
  //
  // Group_by
  // here we can get multiple task for the same process instance, meaning it have multiple job awaiting
  const groupByWorkflowInstanceTasks = _.groupBy(tasks, 'processInstanceKey')

  return (
    <div className="container small dashboard">
      <DashboardHeader
        key={ `header_${ headerKey }`}
        definition={ definitionForHeader }
        headerKey={ headerKey }
        setSorting={ setSorting }
      />
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

  const listTasksLoading = useTracker(
    () => {
      const handle = Meteor.subscribe('tasksDashboard');
      return !handle.ready();
      }, []);

  const listDoctoralSchoolsLoading = useTracker(
    () => {
      const handle = Meteor.subscribe('doctoralSchools');
      return !handle.ready();
    }, []);

  const listRemindersLoading = useTracker(
    () => {
      const handle = Meteor.subscribe('remindersForDashboardTasks');
      return !handle.ready();
    }, []);

  const [sortBy, setSortBy] = useState<SortSpecifier>(
    {
      sort: {
        'variables.doctoralProgramName': 1,
        'variables.phdStudentLastnameDashboard': 1
      }
    }
  )

  let allTasks = useTracker(() => Tasks.find({
      // ignore first step
      "elementId":
        { $ne: "Activity_Program_Assistant_Assigns_Participants" }
    }, {
      ...sortBy
    }
  ).fetch() as unknown as ITaskDashboard[])

  //
  // Render
  if (!account?.isLoggedIn) return <Loader message={'Loading your data...'}/>
  if (listTasksLoading ||
    listRemindersLoading ||
    listDoctoralSchoolsLoading) return <Loader message={'Fetching tasks...'}/>
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
      setSorting={ setSortBy }
    />
  )
}
