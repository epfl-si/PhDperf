import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  useParams
} from "react-router-dom";

import {DoctoralSchoolsList} from "/imports/ui/components/DoctoralSchools/List";
import {ImportScipersForSchool, ImportScipersSchoolSelector} from "/imports/ui/components/ImportSciper/List";
import TaskList from "/imports/ui/components/TaskList";
import {TaskForm} from "/imports/ui/components/TaskForm";
import {Dashboard} from "/imports/ui/components/Dashboard/Dashboard";
import ViewWorkflow from "/imports/ui/components/Workflow/Show";

import Main from "/imports/ui/Main";


function TaskEdit() {
  const {_id} = useParams<{ _id: string }>()
  return <TaskForm _id={_id!}/>
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={<Main />}
      errorElement={<Main />}
    >
      <Route index element={<TaskList />} />
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route
        path="/workflows/:processInstanceKey"
        element={<ViewWorkflow/>}
      />
      <Route path="/tasks/:_id" element={<TaskEdit/>}/>
      <Route path="/tasks/" element={<Navigate replace to="/" />}/>
      <Route path="/doctoral-programs" element={<DoctoralSchoolsList/>}/>
      <Route path="/import-scipers/:doctoralSchool" element={<ImportScipersForSchool/>}/>
      <Route path="/import-scipers/" element={<ImportScipersSchoolSelector/>} />
    </Route>
  )
)
