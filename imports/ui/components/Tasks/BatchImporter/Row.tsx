import React, {useState} from "react"

export const HeaderRow = ({ selectAll } : {selectAll: (state: boolean) => void}) => {
  const [state, setState] = useState(false)

  const defaultColClasses = "text-black align-self-end"

  return (
    <div className="row-header row small font-weight-bold align-self-end pl-2 pb-1">
      <div className={ `col-1 ${defaultColClasses}` }>
        <input
          type="checkbox"
          id="select-all"
          name="select-all"
          checked={ state }
          onChange={ () => { setState(!state); selectAll(!state) } }
        />
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

type RowParameters = {
  doctorat: DoctoratInfo,
  checked: boolean,
  setChecked: (sciper: string) => void
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
    return (
      <>{ coDirector.fullName } ({ coDirector.sciper })</>
    )
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
          <a href={'#'}>Set the Sciper</a>
        </div>
      </>
    )
  }
}

export const Row = ({ doctorat, checked, setChecked }: RowParameters) => {
  const key = doctorat.doctorant.sciper

  const defaultColClasses = "text-black align-self-end"

  return (
    <div className={'doctorat-row pl-2 mb-0 mt-0 pb-1 pt-2 border-top'}>
      <div className={"row small"} key={key}>
        <div className="col-1 text-black align-self-end">
          <input
            type="checkbox"
            id={`phd-selected"-${key}`}
            name={ key }
            value={ key }
            checked={ checked }
            onChange={ () => setChecked(key) }
          />
        </div>
        <div className={ `col-2 ${defaultColClasses}` }><PersonDisplay person={ doctorat.doctorant } boldName={ true } /></div>
        <div className={ `col-2 ${defaultColClasses}` }><PersonDisplay person={ doctorat.thesis.directeur } /></div>
        <div className={ `col-2 ${defaultColClasses}` }><ThesisCoDirectorDisplay coDirector={ doctorat.thesis.coDirecteur } /></div>
        <div className={ `col-2 ${defaultColClasses}` }>
          { doctorat.thesis.mentor && <PersonDisplay person={ doctorat.thesis.mentor } /> }
        </div>
        <div className={ `col-1 ${defaultColClasses}` }>{ doctorat.dateImmatriculation }</div>
        <div className={ `col-1 ${defaultColClasses}` }>{ doctorat.dateExamCandidature }</div>
        <div className={ `col-1 ${defaultColClasses}` }>{ doctorat.thesis.dateAdmThese }</div>
      </div>
    </div>
  );
}
