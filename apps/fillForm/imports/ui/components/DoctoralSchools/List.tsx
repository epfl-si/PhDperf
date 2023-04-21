import React, {useContext, useState} from "react"
import {canEditAtLeastOneDoctoralSchool} from "/imports/policy/doctoralSchools";
import {Loader} from "@epfl/epfl-sti-react-library";
import {CreateForm} from './Create'
import {InlineEdit} from './Edit'
import {useAccountContext} from "/imports/ui/contexts/Account";
import {DataAppContext} from "/imports/ui/contexts/Tasks";
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";


export function DoctoralSchoolsList() {
  const account = useAccountContext()
  const appData = useContext(DataAppContext);

  const [showAdd, setShowAdd] = useState(false)

  const doctoralSchoolsLoading = appData.isDoctoralSchoolsLoading
  const doctoralSchools = appData.doctoralSchools as Array<DoctoralSchool & {readonly:boolean}>

  if (!account || !account.isLoggedIn) return (<Loader message={'Loading your data...'}/>)

  if (account && account.user && canEditAtLeastOneDoctoralSchool(account.user)) return (
    <>
      {doctoralSchoolsLoading ? (
        <Loader message={'Loading doctoral schools...'}/>
      ) : (
        doctoralSchools.length === 0 ? (
          <>
            {
              !showAdd &&
              <button className="btn btn-secondary" onClick={ () => setShowAdd(showAdd => !showAdd) }>
                <i className="fa fa-plus"/>&nbsp;&nbsp;Add a new doctoral program
              </button>
            }
            <div>There is currently no doctoralSchoolsData</div>
          </>
        ) : (<>
            {
              !showAdd &&
              <button className="btn btn-secondary" onClick={ () => setShowAdd(showAdd => !showAdd) }>
                <i className="fa fa-plus"/>&nbsp;&nbsp;Add a new doctoral program
              </button>
            }
            {
              showAdd &&
              <CreateForm toggleCreateForm={ setShowAdd }/>
            }
            <div className={'container mt-3'}>
              {
                doctoralSchools.map((doctoralSchool) =>
                  <InlineEdit key={doctoralSchool._id} doctoralSchool={ doctoralSchool } readonly={ doctoralSchool.readonly} />
                )
              }
            </div>
          </>
        )
      )}
    </>
  )

  return (<div>Your permissions does not allow you to set the doctoral schools.</div>)
}
