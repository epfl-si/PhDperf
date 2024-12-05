import {global_Error, Meteor} from "meteor/meteor";
import React, {useEffect, useState} from "react";
import {useTracker} from "meteor/react-meteor-data";
import {useNavigate, useParams, Link} from "react-router-dom";
import {Alert, Loader} from "@epfl/epfl-sti-react-library";
import {ImportScipersList} from "/imports/api/importScipers/schema";
import StartButton from '/imports/ui/components/ImportSciper/StartButton';
import {HeaderRow, Row} from "/imports/ui/components/ImportSciper/Row";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {DoctoralSchoolInfo} from "/imports/ui/components/ImportSciper/DoctoralSchoolInfo";
import toast from "react-hot-toast";
import _ from "lodash";
import {useAccountContext} from "/imports/ui/contexts/Account";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import DueDatePicker from "/imports/ui/components/Task/DueDatePicker";
import {toastErrorClosable} from "/imports/ui/components/Toasters";


export const ImportScipersSchoolSelector = () => {
  const account = useAccountContext()

  if (!account || !account.isLoggedIn) return (<Loader message={'Loading your data...'}/>)
  if (!account.user || !canImportScipersFromISA(account.user)) return (<div>Your permissions does not allow you to import Scipers.</div>)

  const [input, setInput] = useState('')
  const navigate = useNavigate()

  return (
    <>
      <form onSubmit={ (e) => {
        e.preventDefault()
        navigate(`/import-scipers/${ input.toUpperCase() }`)
      } }>
        Please enter the doctoral program acronym:&nbsp;
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
  const account = useAccountContext()

  const { ISAScipersForSchool,
    ISAScipersLoading,
    isBeingImported,
  } = useTracker(() => {
      const subscription = Meteor.subscribe('importScipersList', doctoralSchool.acronym);
      const ISAScipersForSchool = ImportScipersList.findOne(
        { doctoralSchoolAcronym: doctoralSchool.acronym }
      )

      const ISAScipersLoading: boolean = !subscription.ready()

      const isBeingImported: boolean = ISAScipersForSchool ? ISAScipersForSchool.doctorants?.some((doctorant) => doctorant.isBeingImported) ?? false : false

      return {
        ISAScipersForSchool,
        ISAScipersLoading,
        isBeingImported
      }
    }, [doctoralSchool.acronym])

  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueDateNeeded, setDueDateNeeded] = useState(false)
  const setDueDateChanged = (newDate: Date | undefined) => {
    setDueDate(newDate ?? undefined);
    setDueDateNeeded(!newDate);
  }

  const [importStarted, setImportStarted] = useState(isBeingImported)
  const [isErronous, setIsErronous] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Meteor.apply(
      "getISAScipers", [ doctoralSchool.acronym ], { wait: true, noRetry: true },
      (error: global_Error | Meteor.Error | undefined) => {
        if (error) {
          "reason" in error ? setIsErronous(error.reason!) : setIsErronous(error.message)
        }
      }
    )
  }, [doctoralSchool]);

  const startImport = () => {
    if (!dueDate) {
      setDueDateNeeded(true);
      toastErrorClosable(
        `due-date-import-error-${ Meteor.userId() }`,
        'A due date has to be set'
      );
      return;
    }

    setImportStarted(true)

    const toastId = toast.loading('Launching import of selected entries...')

    Meteor.apply(
      "startProcessInstancesCreation",
      [ doctoralSchool.acronym, dueDate ],
      { wait: true, noRetry: true },
      (error: any | global_Error | Meteor.Error | undefined) => {
        toast.dismiss(toastId)
        if (error) {
          toast.error(error.reason ?? error.message)
          setIsErronous(error.reason ?? error.message)
        } else {
          toast.success("Successfully launched import. Please be patient while entries are getting created...")
        }
        setImportStarted(false)
      }
    )
  }

  if (!account || !account.isLoggedIn) return (<Loader message={'Loading your data...'}/>)
  if (!account.user || !canImportScipersFromISA(account.user)) return (<div>Your permissions does not allow you to import from ISA.</div>)

  if (isErronous) return <Alert alertType={ 'danger' } title={ 'Error' } message={ isErronous } onCloseClick={ () => navigate(`/import-scipers/`) } />

  if (ISAScipersLoading) return <Loader message={`Fetching ISA for the list of ${doctoralSchool.acronym} PhD students...`}/>

  if (!ISAScipersForSchool) return <div>ISA has not data for the {doctoralSchool.acronym} school</div>

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
            ISA List fetched at {ISAScipersForSchool.createdAt.toLocaleString('fr-CH')}
          </div>
        }
        <hr />
        <div>
          <StartButton total={ total } nbSelected={ nbSelected } isStarted={ importStarted } startFunc={ startImport }/>
          <DueDatePicker
            value={ dueDate }
            futureOnly={ true }
            isNeeded={ dueDateNeeded }
            setDueDateCallback={ setDueDateChanged }
          />
        </div>
      </div>
      <div className="container import-scipers-selector">
        <HeaderRow doctoralSchool={ doctoralSchool } isAllSelected={ ISAScipersForSchool.isAllSelected } disabled={ importStarted }/>
        { ISAScipersForSchool.doctorants &&
          _.sortBy(ISAScipersForSchool.doctorants, (d) => d.dateExamCandidature?.split('.')[1]).map((doctorantInfo) =>
          <Row
            key={ doctorantInfo.doctorant.sciper }
            doctoralSchool={ doctoralSchool }
            doctorant={ doctorantInfo }
            checked={ doctorantInfo.isSelected }
          />
        )}
        <div className={'mt-3'}>
          <StartButton total={ total } nbSelected={ nbSelected } isStarted={ importStarted } startFunc={ startImport }/>
        </div>
      </div>
    </>
  )
}

export function ImportSciperLoader({doctoralSchoolAcronym}: {doctoralSchoolAcronym?: string}) {
  const account = useAccountContext()

  const doctoralSchoolsLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('doctoralSchools');
    return !handle.ready();
  }, []);

  const currentDoctoralSchool = useTracker(
    () => DoctoralSchools.findOne({ acronym: doctoralSchoolAcronym }),
    [])

  if (!account || !account.isLoggedIn) return (<Loader message={'Loading your data...'}/>)

  if (!canImportScipersFromISA(account.user)) return (<div>Your permissions does not allow you to import from Doctoral programs.</div>)

  if (doctoralSchoolsLoading) return <Loader message={`Loading the ${doctoralSchoolAcronym} doctoral program data...`}/>

  if (!currentDoctoralSchool) return (
    <>
      <div><b>{doctoralSchoolAcronym}</b> is an unknown doctoral program</div>
      <Link to={`/import-scipers`}>Try a different school acronym</Link>
    </>
  )

  return <ImportSciperList doctoralSchool={ currentDoctoralSchool } />
}
