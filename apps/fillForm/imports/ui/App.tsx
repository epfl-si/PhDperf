import React from 'react';
import {router} from "/imports/ui/routes";
import {RouterProvider} from "react-router-dom";
import {AccountProvider} from "/imports/ui/contexts/Account";
import {ConnectionStatusProvider} from "/imports/ui/contexts/ConnectionStatus";
import {DataAppContext} from "/imports/ui/contexts/Tasks";
import {useTracker} from "meteor/react-meteor-data";
import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {ITaskList} from "/imports/policy/tasksList/type";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";


const getDataAppValue = () => {
  const isTasksListLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasksList');
    return !handle.ready();
  }, []);

  const tasksList = useTracker(() => Tasks.find({}).fetch() as ITaskList[])

  const isTasksDashboardLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasksDashboard');
    return !handle.ready();
  }, []);
  const tasksDashboard = useTracker(
    () => Tasks.find({"elementId": {$ne: "Activity_Program_Assistant_Assigns_Participants"}})
      .fetch() as ITaskDashboard[])

  const isDoctoralSchoolsLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('doctoralSchools');
    return !handle.ready();
  }, []);

  const doctoralSchools = useTracker(
    () => DoctoralSchools.find({}, { sort: { 'acronym': 1 } }).fetch() as Array<DoctoralSchool & {readonly:boolean}>
    , [])

  return {
    isTasksListLoading,
    tasksList,
    isTasksDashboardLoading,
    tasksDashboard,
    isDoctoralSchoolsLoading,
    doctoralSchools,
  }
}

export const App = () => {
  return (
  <ConnectionStatusProvider>
    <AccountProvider>
      <DataAppContext.Provider value={ getDataAppValue() } >
        <RouterProvider router={router}/>
      </DataAppContext.Provider>
    </AccountProvider>
  </ConnectionStatusProvider>
  )
}
