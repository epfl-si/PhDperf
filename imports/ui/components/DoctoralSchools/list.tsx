import React, {useState} from "react"
import {useTracker} from "meteor/react-meteor-data";
import {Meteor} from "meteor/meteor";
import {canEditDoctoralSchools} from "/imports/policy/doctoralSchools";
import {Loader} from "@epfl/epfl-sti-react-library";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {CreateForm} from './create'
import {InlineEdit} from './edit'


export function DoctoralSchoolsList() {
  const [showAdd, setShowAdd] = useState(false)

  const userLoaded = !!useTracker(() => {
    return Meteor.user();
  }, []);

  const doctoralSchoolsLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('doctoralSchools');
    return !handle.ready();
  }, []);

  const doctoralSchools = useTracker(
    () => DoctoralSchools.find({}, { sort: { 'acronym': 1 } }).fetch()
  , []) as DoctoralSchool[]

  if (!userLoaded) return (<div>Loading user</div>)
  if (userLoaded && !canEditDoctoralSchools()) return (<div>Your permissions does not allow you to set the doctoral schools.</div>)

  return (
    <>
      {doctoralSchoolsLoading ? (
        <Loader message={'Loading doctoral schools data...'}/>
      ) : (
        doctoralSchools.length === 0 ? (
          <>
            {
              !showAdd &&
              <button className="btn btn-secondary" onClick={ () => setShowAdd(showAdd => !showAdd) }>
                <i className="fa fa-plus"/>&nbsp;&nbsp;Add a new doctoral school
              </button>
            }
            <div>There is currently no doctoralSchoolsData</div>
          </>
        ) : (<>
            {
              !showAdd &&
              <button className="btn btn-secondary" onClick={ () => setShowAdd(showAdd => !showAdd) }>
                <i className="fa fa-plus"/>&nbsp;&nbsp;Add a new doctoral school
              </button>
            }
            {
              showAdd &&
              <CreateForm toggleCreateForm={ setShowAdd }/>
            }
            <div className={'container mt-3'}>
              {
                doctoralSchools.map((doctoralSchool) =>
                  <InlineEdit key={doctoralSchool._id} doctoralSchool={ doctoralSchool } />
                )
              }
            </div>
          </>
        )
      )}
    </>
  )
}
