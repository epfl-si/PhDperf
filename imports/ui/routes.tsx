import {Navigate, Route, Routes, useParams} from "react-router-dom";
import {canEditAtLeastOneDoctoralSchool} from "/imports/policy/doctoralSchools";
import {DoctoralSchoolsList} from "/imports/ui/components/DoctoralSchools/List";
import {Dashboard} from "/imports/ui/components/Dashboard";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {ImportScipersForSchool, ImportScipersSchoolSelector} from "/imports/ui/components/ImportSciper/List";
import TaskList from "/imports/ui/components/TaskList";
import React from "react";
import {useAccountContext} from "/imports/ui/components/Account";
import {TaskForm} from "/imports/ui/components/TaskForm";

function TaskEdit() {
  const {_id} = useParams<{ _id: string }>()
  return <TaskForm _id={_id!}/>
}

export const PhDRoutes = () => {
  const account = useAccountContext()

  return (
    <Routes>
      { account && account.user && canEditAtLeastOneDoctoralSchool(account.user) &&
        <Route path="/doctoral-programs" element={<DoctoralSchoolsList/>}/>
      }
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/tasks/:_id" element={<TaskEdit/>} />
      <Route path="/tasks/" element={<Navigate replace to="/" />} />
      { account && account.user && canImportScipersFromISA(account.user) &&
        <>
          <Route path="/import-scipers/:doctoralSchool" element={<ImportScipersForSchool/>}/>
          <Route path="/import-scipers/" element={<ImportScipersSchoolSelector/>} />
        </>
      }
      <Route path="/" element={<TaskList />} />
    </Routes>
  )
}
