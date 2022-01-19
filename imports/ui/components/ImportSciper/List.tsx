import {global_Error, Meteor} from "meteor/meteor";
import React, {useState} from "react";
import {useTracker} from "meteor/react-meteor-data";
import {useNavigate, useParams, Link} from "react-router-dom";
import {Loader} from "@epfl/epfl-sti-react-library";
import {ImportScipersList} from "/imports/api/importScipers/schema";
import StartButton from '/imports/ui/components/ImportSciper/StartButton';
import {HeaderRow, Row} from "/imports/ui/components/ImportSciper/Row";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {DoctoralSchoolInfo} from "/imports/ui/components/ImportSciper/DoctoralSchoolInfo";


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
  } = useTracker(() => {
      const subscription = Meteor.subscribe('importScipersList', doctoralSchool.acronym);
      const ISAScipersForSchool = ImportScipersList.findOne(
        { doctoralSchoolAcronym: doctoralSchool.acronym }
      ) as ImportScipersList

      const ISAScipersLoading: boolean = !subscription.ready()

      return {
        ISAScipersForSchool,
        ISAScipersLoading,
      }
    }, [doctoralSchool.acronym])

  if (ISAScipersLoading) {
    return <Loader message={`Loading the ISA data for ${doctoralSchool.acronym}...`}/>
  } else {
    if (!ISAScipersForSchool) {
      return <div>There is no data to load for the {doctoralSchool.acronym} school</div>
    } else {
      const total = ISAScipersForSchool?.doctorants?.length ?? 0
      const nbSelected = ISAScipersForSchool?.doctorants?.filter(doctorant => doctorant.isSelected).length ?? 0
      return (
        <>
          <div>
            <div className={'mb-3'}>
              <DoctoralSchoolInfo doctoralSchool={ doctoralSchool }/>
            </div>
            { ISAScipersForSchool.createdAt &&
              <div className={'small'}>
                List fetched from ISA at {ISAScipersForSchool.createdAt.toLocaleString('fr-CH')}
              </div>
            }
            <hr />
            <StartButton total={ total } nbSelected={ nbSelected }/>
          </div>
          <div className="container import-scipers-selector">
            <HeaderRow doctoralSchool={ doctoralSchool } isAllSelected={ ISAScipersForSchool.isAllSelected }/>
            { ISAScipersForSchool.doctorants && ISAScipersForSchool.doctorants.map((doctorantInfo) =>
              <Row
                key={ doctorantInfo.doctorant.sciper }
                doctoralSchool={ doctoralSchool }
                doctorant={ doctorantInfo }
                checked={ doctorantInfo.isSelected }
              />
            )}
            <div className={'mt-3'}>
              <StartButton total={ total } nbSelected={ nbSelected }/>
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
