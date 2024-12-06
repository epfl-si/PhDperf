import {Meteor} from "meteor/meteor";
import React, {useState} from "react"
import toast from "react-hot-toast";

import {Person} from "/imports/api/importScipers/isaTypes"
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {DoctorantInfoSelectable} from "/imports/api/importScipers/schema";


const PersonDisplay = ({ person, boldName = false, showSciper = true }: { person?: Person, boldName?: boolean, showSciper?: boolean }) => {
  if (person) {
    return <div>
      <div className={ boldName ? 'font-weight-bold' : '' }>{ person.fullName }</div>
      { showSciper &&
        <div>{ person.sciper }</div>
      }
    </div>
  } else {
    return <div></div>
  }
}

const ThesisCoDirectorDisplay = ({
                                   doctoralSchool,
                                   doctorant,
                                   coDirector,
                                   isSciperNeeded,
                                   showSciper
                                 }: { doctoralSchool: DoctoralSchool, doctorant: Person, coDirector?: Person, isSciperNeeded?: boolean, showSciper?: boolean }) => {
  const [isSending, setIsSending] = useState(false)
  const [newSciper, setNewSciper] = useState('')

  const setCoDirectorNewSciper = (e: any) => {
    e.preventDefault()
    e.stopPropagation()

    if (!e.target.checkValidity()) {
      e.target.reportValidity()
    } else {
      if (!newSciper) return

      setIsSending(true)

      Meteor.call('setCoDirectorSciper', doctoralSchool.acronym, doctorant.sciper, newSciper.toUpperCase(), (error: any) => {
          if (error) {
            toast.error(`Error: ${error.reason}`)
          } else {
            toast.success(`Successfully added the sciper ${newSciper} to ${coDirector?.fullName}`)
          }
          setIsSending(false)
        }
      )
    }
  }

  return (
    <>{coDirector &&
        <PersonDisplay person={coDirector} showSciper={!isSciperNeeded && showSciper} />
      }
      { coDirector && isSciperNeeded &&
        <div>
          <form role="form" onSubmit={ setCoDirectorNewSciper }>
            <input type="text"
                   className={'is-invalid'}
                   id="sciper"
                   name="sciper"
                   maxLength={6}
                   size={6}
                   placeholder={'Gxxxxx'}
                   pattern={ "[G|g][0-9]{5}" }
                   title={ 'Sciper has to be a guest one. Ex. G12345' }
                   value={ newSciper }
                   onChange={ (e) => setNewSciper(e.target.value)}
            />
            { !isSending &&
              <button type="submit">Set</button>
            }

            { isSending &&
              <span className="loader" />
            }
          </form>
        </div>
      }
    </>
  )
}

type RowParameters = {
  doctorant: DoctorantInfoSelectable,
  doctoralSchool: DoctoralSchool,
  checked: boolean,
}

export const Row = ({ doctorant, doctoralSchool, checked }: RowParameters) => {
  const [isToggling, setIsToggling] = useState(false)

  const key = doctorant.doctorant.sciper

  const toggleCheck = (doctorantId: string) => {
    setIsToggling(true)

    Meteor.call('toggleDoctorantCheck', doctoralSchool.acronym, doctorantId, !checked, (error: any) => {
        if (!error) {
          setIsToggling(false)
        }
      }
    )
  }

  const defaultColClasses = "align-self-end"
  let defaultRowClasses = "row small align-items-end"

  if (doctorant.hasAlreadyStarted) {
    defaultRowClasses += ' bg-success  text-white'
  }

  return (
    <div className={'doctorat-row pl-2 mb-2 mt-0 pb-1 pt-2 border-top'}>
      <div className={ defaultRowClasses } key={key}>
        <div className="col-1">
          <input
            type="checkbox"
            id={`phd-selected"-${key}`}
            name={ key }
            value={ key }
            checked={ checked }
            onChange={ () => toggleCheck(key) }
            disabled={ isToggling ||
              doctorant.needCoDirectorData ||
              !doctorant.thesis?.directeur ||
              !doctorant.thesis?.mentor ||
              doctorant.hasAlreadyStarted ||
              doctorant.isBeingImported
          }
          />
          &nbsp;
          { doctorant.needCoDirectorData && !(isToggling || doctorant.isBeingImported || doctorant.hasAlreadyStarted) &&
            <>
              <span className={'h4 text-danger ml-1'} title="Co-director sciper is missing. Please enter the guest sciper account">⚠</span>
            </>
          }
          { !doctorant.thesis?.directeur && !(isToggling || doctorant.isBeingImported || doctorant.hasAlreadyStarted) &&
            <>
              <span
                className={'h4 text-danger ml-1'}
                title="Thesis director is missing. Please enter the information in EDOC portal in ISA and re-import the list to start this student process">
                ⚠
              </span>
            </>
          }
          { !doctorant.thesis?.mentor && !(isToggling || doctorant.isBeingImported || doctorant.hasAlreadyStarted) &&
            <>
              <span className={'h4 text-danger ml-1'} title="Mentor sciper is missing. Please enter the information in EDOC portal in ISA and re-import the list">⚠</span>
            </>
          }
          { doctorant.hasAlreadyStarted && !(isToggling || doctorant.isBeingImported) &&
            <>
              <span className={'h6 ml-2'} title="This student already has an annual report in progress">🛈</span>
            </>
          }
          { (isToggling || doctorant.isBeingImported) &&
            <>&nbsp;<span className="loader" /></>
          }
        </div>
        <div className={ `col-2 ${defaultColClasses}` }><PersonDisplay person={ doctorant.doctorant } boldName={ true } /></div>
        <div className={ `col-2 ${defaultColClasses}` }><PersonDisplay person={ doctorant.thesis.directeur } /></div>
        <div className={ `col-2 ${defaultColClasses}` }>
          <ThesisCoDirectorDisplay
            doctoralSchool={ doctoralSchool }
            doctorant={ doctorant.doctorant }
            coDirector={ doctorant.thesis.coDirecteur }
            isSciperNeeded={ doctorant.needCoDirectorData && !doctorant.hasAlreadyStarted }
            showSciper={ !doctorant.needCoDirectorData || !doctorant.hasAlreadyStarted }
          />
        </div>
        <div className={ `col-2 ${defaultColClasses}` }>
          { doctorant.thesis.mentor && <PersonDisplay person={ doctorant.thesis.mentor } /> }
        </div>
        <div className={ `col-1 ${defaultColClasses}` }>{ doctorant.dateImmatriculation }</div>
        <div className={ `col-1 ${defaultColClasses}` }>{ doctorant.dateExamCandidature }</div>
        <div className={ `col-1 ${defaultColClasses}` }>{ doctorant.thesis.dateAdmThese }</div>
      </div>
    </div>
  );
}
