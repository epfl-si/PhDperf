import {Meteor} from "meteor/meteor";
import React, {useState} from "react"
import {Person} from "/imports/api/importScipers/isaTypes"
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {DoctorantInfoSelectable} from "/imports/api/importScipers/schema";


export const HeaderRow = ({doctoralSchool, isAllSelected} : {doctoralSchool: DoctoralSchool, isAllSelected: boolean}) => {
  const [isToggling, setIsToggling] = useState(false)

  const defaultColClasses = "text-black align-self-end"

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

const ThesisCoDirectorDisplay = ({ coDirector }: { coDirector: Person | undefined }) => {
  if (coDirector) {
    return <PersonDisplay person={coDirector} />
  } else {
    return (
      <>
        <div>
          <input type="text"
               id="sciper"
               name="sciper"
               maxLength={6}
               size={6}
               pattern={ "[A-Za-z]{1}[0-9]{5}" }
          />
        </div>
        <div>
          <a href={'#'}>Set Sciper</a>
        </div>
      </>
    )
  }
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

  return (
    <div className={'doctorat-row pl-2 mb-2 mt-0 pb-1 pt-2 border-top'}>
      <div className={"row small"} key={key}>
        <div className="col-1 text-black align-self-end">
          <input
            type="checkbox"
            id={`phd-selected"-${key}`}
            name={ key }
            value={ key }
            checked={ checked }
            onChange={ () => toggleCheck(key) }
            disabled={ isToggling }
          />&nbsp;
          { isToggling &&
            <span className="loader" />
          }
        </div>
        <div className={ `col-2 ${defaultColClasses}` }><PersonDisplay person={ doctorant.doctorant } boldName={ true } /></div>
        <div className={ `col-2 ${defaultColClasses}` }><PersonDisplay person={ doctorant.thesis.directeur } /></div>
        <div className={ `col-2 ${defaultColClasses}` }><ThesisCoDirectorDisplay coDirector={ doctorant.thesis.coDirecteur } /></div>
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
