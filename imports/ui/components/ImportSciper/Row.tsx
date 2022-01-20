import {Meteor} from "meteor/meteor";
import React, {useState} from "react"
import {Person} from "/imports/api/importScipers/isaTypes"
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {DoctorantInfoSelectable} from "/imports/api/importScipers/schema";
import toast from "react-hot-toast";


export const HeaderRow = ({doctoralSchool, isAllSelected} : {doctoralSchool: DoctoralSchool, isAllSelected: boolean}) => {
  const [isToggling, setIsToggling] = useState(false)

  const defaultColClasses = "align-self-end"

  const setAllCheck = (state: boolean) => {
    setIsToggling(true)

    Meteor.call('toggleAllDoctorantCheck', doctoralSchool.acronym, state, (error: any) => {
        if (!error) {
          setIsToggling(false)
        }
      }
    )
  }

  return (
    <div className="row-header row small font-weight-bold align-self-end pl-2 pb-1">
      <div className={ `col-1 ${defaultColClasses}` }>
        <input
          type="checkbox"
          id="select-all"
          name="select-all"
          checked={ isAllSelected }
          disabled={ isToggling }
          onChange={ () => { setAllCheck(!isAllSelected); } }
        />
        { isToggling &&
          <span className="loader" />
        }
      </div>
      <div className={ `col-2 ${defaultColClasses}` }>Student Name</div>
      <div className={ `col-2 ${defaultColClasses}` }>Thesis director</div>
      <div className={ `col-2 ${defaultColClasses}` }>Thesis co-director</div>
      <div className={ `col-2 ${defaultColClasses}` }>Mentor</div>
      <div className={ `col-1 ${defaultColClasses}` }>Immatricul. date</div>
      <div className={ `col-1 ${defaultColClasses}` }>Exam candidature</div>
      <div className={ `col-1 ${defaultColClasses}` }>Admin these date</div>
    </div>
  )
}

const PersonDisplay = ({ person, boldName = false }: { person: Person, boldName?: boolean }) => {
  return (
    <div>
      <div className={boldName ? 'font-weight-bold' : ''}>{ person.fullName }</div>
      <div>{ person.sciper }</div>
    </div>
  )
}

const ThesisCoDirectorDisplay = ({
                                   doctoralSchool,
                                   doctorant,
                                   coDirector,
                                   isSciperNeeded
                                 }: { doctoralSchool: DoctoralSchool, doctorant: Person, coDirector: Person | undefined, isSciperNeeded: boolean | undefined }) => {
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

      Meteor.call('setCoDirectorSciper', doctoralSchool.acronym, doctorant.sciper, newSciper, (error: any) => {
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
    <>
      { !isSciperNeeded && coDirector && <PersonDisplay person={coDirector as Person} /> }
      { isSciperNeeded &&
        <>
          {coDirector &&
            <span>{coDirector.fullName}</span>
          }
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
            { isSending &&
              <span className="loader" />
            }
          </div>
        </>
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
  const defaultRowClasses = "row small align-items-end"

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
            disabled={ isToggling || doctorant.needCoDirectorData }
          />
          &nbsp;
          { doctorant.needCoDirectorData &&
            <>
              &nbsp;
              <span className={'h4'} title="This doctorant need a guest sciper for his/her CoDirector">⚠</span>
            </>
          }
          { isToggling &&
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
            isSciperNeeded={doctorant.needCoDirectorData}
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
