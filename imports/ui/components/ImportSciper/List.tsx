import {global_Error, Meteor} from "meteor/meteor";
import React, {useState} from "react";
import {useTracker} from "meteor/react-meteor-data";
import { Map } from 'immutable'
import {useNavigate, useParams, Link} from "react-router-dom";
import {Loader} from "@epfl/epfl-sti-react-library";
import {ImportScipersList} from "/imports/api/importScipers/schema";
import StartButton from '/imports/ui/components/ImportSciper/StartButton';
import {HeaderRow, Row} from "/imports/ui/components/ImportSciper/Row";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {DoctoralSchoolInfo} from "/imports/ui/components/ImportSciper/DoctoralSchoolInfo";
import {DoctorantInfo} from "/imports/api/importScipers/isaTypes";


export const ImportScipersSchoolSelector = () => {
  const [input, setInput] = useState('EDIC')
  const navigate = useNavigate()

  return (
    <>
      <form onSubmit={ (e) => {
        e.preventDefault()
        navigate(`/import-scipers/${ input.toUpperCase() }`)
      } }>
        Please enter the doctoral school acronym:&nbsp;
        <input value={input} type={'text'} onChange={ (e) => setInput(e.target.value)}/>
        <button type={'submit'}>Get ISA students list</button>
      </form>
    </>
  )
}

export function ImportScipersForSchool() {
  const {doctoralSchool} = useParams<{ doctoralSchool: string }>()

  return <ImportSciperLoader doctoralSchoolAcronym={doctoralSchool}/>
}

export function ImportSciperList({ doctoralSchool }: { doctoralSchool: DoctoralSchool }) {
  const { ISAScipersForSchool,
    ISAScipersLoading,
    doctorats
  } = useTracker(() => {
      const subscription = Meteor.subscribe('importScipersList', doctoralSchool.acronym);
      const ISAScipersForSchool = ImportScipersList.findOne(
        { doctoralSchoolAcronym: doctoralSchool.acronym }
      ) as ImportScipersList

      const ISAScipersLoading: boolean = !subscription.ready()
      const doctorats = ISAScipersLoading ? [] : ISAScipersForSchool?.doctorants ?? []

      return {
        ISAScipersForSchool,
        ISAScipersLoading,
        doctorats,
      }
    }, [doctoralSchool.acronym])

  const [checkedState, setCheckedState] = useState(
    // get a { sciper: isSelected } like object
    doctorats.reduce((acc: Map<any, boolean>, doctorat: DoctorantInfo) => {
      return acc.set(doctorat.doctorant.sciper, false)
    }, Map()) as Map<any, boolean>
  )

  const [nbSelected, setNbSelected] = useState(0)

  const refreshNbSelected = () => {
    setNbSelected([...checkedState.values()].filter(b => b).length)
  }

  const setChecked = (sciper: string) => {
    setCheckedState(checkedState.set(sciper, !checkedState.get(sciper)))
    refreshNbSelected()
  }

  const setAllCheck = (state: boolean) => {
    [...checkedState.keys()].forEach((key) => checkedState.set(key, state))
    setCheckedState(checkedState)
    refreshNbSelected()
  }

  if (ISAScipersLoading) {
    return <Loader message={`Loading the ISA data for ${doctoralSchool.acronym}...`}/>
  } else {
    if (!ISAScipersForSchool) {
      return <div>There is no data to load for the {doctoralSchool.acronym} school</div>
    } else {
      return (
        <>
          <div>
            <div className={'mb-3'}>
              <DoctoralSchoolInfo doctoralSchool={doctoralSchool}/>
            </div>
            <hr />
            <StartButton nbSelected={nbSelected}/>
          </div>
          <div className="container import-scipers-selector">
            <HeaderRow selectAll={setAllCheck}/>
            {doctorats && doctorats.map((doctorat) =>
              <Row
                key={doctorat.doctorant.sciper}
                doctorat={doctorat}
                checked={checkedState.get(doctorat.doctorant.sciper) ?? false}
                setChecked={setChecked}
              />
            )}
            <div className={'mt-3'}>
              <StartButton nbSelected={nbSelected}/>
            </div>
          </div>
        </>
      )
    }
  }
}

export function ImportSciperLoader({doctoralSchoolAcronym}: {doctoralSchoolAcronym?: string}) {
  const doctoralSchoolsLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('doctoralSchools');
    return !handle.ready();
  }, []);

  const currentDoctoralSchool = useTracker(
    () => DoctoralSchools.findOne({ acronym: doctoralSchoolAcronym }),
    []) as DoctoralSchool

  if (doctoralSchoolsLoading) {
    return <Loader message={`Loading the ${doctoralSchoolAcronym} doctoral school data...`}/>
  } else {
    if (!currentDoctoralSchool) {
      return (
        <>
          <div><b>{doctoralSchoolAcronym}</b> is an unknown doctoral school</div>
          <Link to={`/import-scipers`}>Try a different school acronym</Link>
        </>
      )
    } else {
      Meteor.apply(
        "getISAScipers", [ currentDoctoralSchool.acronym ], { wait: true, noRetry: true },
        (error: global_Error | Meteor.Error | undefined) => {
          if (error) {
            return <div>Error: ${error.message}</div>
          }
        }
      )
      return <ImportSciperList doctoralSchool={ currentDoctoralSchool } />
    }
  }
}
