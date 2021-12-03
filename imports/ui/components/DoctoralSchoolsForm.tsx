import React, {useState} from "react"
import {useTracker} from "meteor/react-meteor-data";
import {Meteor} from "meteor/meteor";
import {canAccessDoctoralSchoolEdition} from "/imports/policy/doctoralSchools";
import {Loader} from "@epfl/epfl-sti-react-library";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools";
import _ from "lodash";


export function DoctoralSchoolsForm() {
  const [acronym, setAcronym] = useState("");
  const [label, setLabel] = useState("");

  const userLoaded = !!useTracker(() => {
    return Meteor.user();
  }, []);

  const doctoralSchoolsLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('doctoralSchools');
    return !handle.ready();
  }, []);

  const doctoralSchoolsData = useTracker(
      () => DoctoralSchools.find({}).fetch()
  ) as DoctoralSchool[]

  if (!userLoaded) return (<div>Loading user</div>)
  if (userLoaded && !canAccessDoctoralSchoolEdition()) return (<div>Your permission does not allow you to see the dashboard </div>)


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!acronym || !label) return

    Meteor.call('insertDoctoralSchool', {
      acronym: acronym.trim(),
      label: label.trim(),
      } as DoctoralSchool
    )

    setAcronym("")
    setLabel("")
  }

  return (
    <>
      {doctoralSchoolsLoading ? (
        <Loader message={'Loading doctoral schools data...'}/>
      ) : (
          doctoralSchoolsData.length === 0 ? (
            <div>There is currently no doctoralSchoolsData</div>
        ) : (<>
          <form className="doctoral-schools-form" onSubmit={handleSubmit}>
            <div className="form-group">

              <label htmlFor="acronymInput">Acronym</label>
              <input
                id="acronymInput"
                className="form-control"
                type="text"
                placeholder="Type to add the new acronym"
                value={ acronym }
                onChange={ (e) => setAcronym(e.target.value) }
              />
            </div>
            <div className="form-group">
              <label htmlFor="labelInput">Label</label>
              <input
                  id="labelInput"
                  className="form-control"
                  type="text"
                  placeholder="Type to add the new label"
                  value={ label }
                  onChange={ (e) => setLabel(e.target.value) }
              />
            </div>
            <button type="submit" className="btn btn-primary">Add doctoral school</button>
          </form>
          <div className={'my-4'}>
          {
            doctoralSchoolsData.map((doctoralSchool) => (
            <div>{JSON.stringify(_.omit(doctoralSchool, '_id'))}</div>
            ))
          }
          </div>
          </>
        )
      )}
    </>
  )
}
