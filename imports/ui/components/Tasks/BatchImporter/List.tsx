import React, {useState} from "react";
import isaReturnExample from './edic.json'
import StartButton from "/imports/ui/components/Tasks/BatchImporter/StartButton";
import {HeaderRow, Row} from "/imports/ui/components/Tasks/BatchImporter/Row";
import {useHistory, useParams, Link} from "react-router-dom";
import {Meteor} from "meteor/meteor";
import {useTracker} from "meteor/react-meteor-data";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {DoctoralSchoolInfo} from "/imports/ui/components/Tasks/BatchImporter/DoctoralSchoolInfo";
import {Loader} from "@epfl/epfl-sti-react-library";


// will be the API call
const doctorats = isaReturnExample[0].doctorants as DoctoratInfo[]

export const ImportScipersSchoolSelector = () => {
  const [input, setInput] = useState('')
  const history = useHistory()

  return (
    <>
      <form onSubmit={ (e) => {
        e.preventDefault()
        history.push(`/import-scipers/${ input.toUpperCase() }`)
      } }>
        Please enter the doctoral school acronym:&nbsp;
        <input value={input} type={'text'} onChange={ (e) => setInput(e.target.value)}/>
        <button type={'submit'}>Get ISA students list</button>
      </form>
    </>
  )
}

export function BatchImporterForSchool() {
  const {doctoralSchool} = useParams<{ doctoralSchool: string }>()
  return <ImportScipers doctoralSchool={doctoralSchool}/>
}


export function ImportScipers({doctoralSchool}: {doctoralSchool?: string}) {
  const [checkedState, setCheckedState] = useState(
    // get a { sciper: isSelected } like object
    doctorats.reduce((acc, doctorat) => {
      return acc.set(doctorat.doctorant.sciper, false)
      }, new Map())
  )

  const [nbSelected, setNbSelected] = useState(0)

  const refreshNbSelected = () => {
    setNbSelected([...checkedState.values()].filter(b => b).length)
  }

  const setChecked = (sciper: string) => {
    checkedState.set(sciper, !checkedState.get(sciper))
    setCheckedState(new Map(checkedState))
    refreshNbSelected()
  }

  const setAllCheck = (state: boolean) => {
    [...checkedState.keys()].forEach((key) => checkedState.set(key, state))
    setCheckedState(new Map(checkedState))
    refreshNbSelected()
  }

  const doctoralSchoolsLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('doctoralSchools');
    return !handle.ready();
  }, []);

  const currentDoctoralSchool = useTracker(
    () => DoctoralSchools.findOne({ acronym: doctoralSchool }),
    []) as DoctoralSchool

  if (!currentDoctoralSchool) {
    return (
      <>
        <div><b>{doctoralSchool}</b> is an unknown doctoral school</div>
        <Link to={`/import-scipers`}>Try a different school acronym</Link>
      </>
    )
  }

  return (
    <div>
      { doctoralSchoolsLoading &&
          <Loader message={`Loading the ${doctoralSchool} doctoral school data...`}/>
      }
      { !doctoralSchoolsLoading &&
        <>
          <DoctoralSchoolInfo doctoralSchool={currentDoctoralSchool}/>
          <StartButton nbSelected={nbSelected} />
        </>
      }

      <div className="container import-scipers-selector">
        <HeaderRow selectAll={setAllCheck}/>
        <hr/>
        { !doctoralSchoolsLoading && doctorats.map((doctorat) =>
          <Row
            key={doctorat.doctorant.sciper}
            doctorat={doctorat}
            checked={checkedState.get(doctorat.doctorant.sciper)}
            setChecked={setChecked}
          />
        )}
        { !doctoralSchoolsLoading &&
          <>
            <hr/>
            <StartButton nbSelected={nbSelected}/>
          </>
        }
      </div>
    </div>
  );
}
