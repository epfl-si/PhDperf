import {createContext} from "react";
import {ITaskList} from "/imports/policy/tasksList/type";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";


// load all the data needed by the app, so they are loaded globally
export type DataAppContextType = {
  isTasksListLoading: boolean;
  tasksList: ITaskList[];
  isTasksDashboardLoading: boolean;
  tasksDashboard: ITaskDashboard[];
  isDoctoralSchoolsLoading: boolean;
  doctoralSchools: DoctoralSchool[];
}

export const DataAppContext = createContext<DataAppContextType>(
  {
    isTasksListLoading: true,
    tasksList: [],
    isTasksDashboardLoading: true,
    tasksDashboard: [],
    isDoctoralSchoolsLoading: true,
    doctoralSchools: [],
  }
)
