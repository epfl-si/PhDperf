import React, {useState} from "react"

export const HeaderRow = ({ selectAll } : {selectAll: (state: boolean) => void}) => {
  const [state, setState] = useState(false)

  return (
    <div className="row-header row small font-weight-bold">
      <div className="participant col-1 text-black align-self-end">
        <input
          type="checkbox"
          id="select-all"
          name="select-all"
          checked={ state }
          onChange={ () => { setState(!state); selectAll(!state) } }
        />
      </div>
      <div className="participant col-2 text-black align-self-end">Student Name</div>
      <div className="participant col-2 text-black align-self-end">Thesis director</div>
      <div className="participant col-2 text-black align-self-end">Thesis co-director</div>
      <div className="participant col-2 text-black align-self-end">Mentor</div>
      <div className="participant col-1 text-black align-self-end">Immatricul. date</div>
      <div className="participant col-1 text-black align-self-end">Exam candidature</div>
      <div className="participant col-1 text-black align-self-end">Admin these date</div>
    </div>
  )
}

type RowParameters = {
  doctorat: DoctoratInfo,
  checked: boolean,
  setChecked: (sciper: string) => void
}

const PersonDisplay = ({ person }: { person: Person }) => {
  return (
    <>{ person.fullName } ({ person.sciper })</>
  )
}

const ThesisCoDirectorDisplay = ({ coDirector }: { coDirector: Person | undefined }) => {
  if (coDirector) {
    return (
      <>{ coDirector.fullName } ({ coDirector.sciper })</>
    )
  } else {
    return (
      <a href={'#'}>Set the Sciper</a>
    )
    return (
      <input type="text"
             id="sciper"
             name="sciper"
             maxLength={6}
             size={6}
             pattern={ "[A-Za-z]{1}[0-9]{5}" }
      />
    )
  }
}

export const Row = ({ doctorat, checked, setChecked }: RowParameters) => {
  const key = doctorat.doctorant.sciper

  return (
    <div className={"row small"} key={key}>
      <div className="participant col-1 text-black align-self-end">
        <input
          type="checkbox"
          id={`phd-selected"-${key}`}
          name={ key }
          value={ key }
          checked={ checked }
          onChange={ () => setChecked(key) }
        />
      </div>
      <div className="participant col-2 text-black align-self-end font-weight-bold"><PersonDisplay person={ doctorat.doctorant } /></div>
      <div className="participant col-2 text-black align-self-end"><PersonDisplay person={ doctorat.thesis.directeur } /></div>
      <div className="participant col-2 text-black align-self-end"><ThesisCoDirectorDisplay coDirector={ doctorat.thesis.coDirecteur } /></div>
      <div className="participant col-2 text-black align-self-end">
        { doctorat.thesis.mentor && <PersonDisplay person={ doctorat.thesis.mentor } /> }
      </div>
      <div className="participant col-1 text-black align-self-end">{ doctorat.dateImmatriculation }</div>
      <div className="participant col-1 text-black align-self-end">{ doctorat.dateExamCandidature }</div>
      <div className="participant col-1 text-black align-self-end">{ doctorat.thesis.dateAdmThese }</div>
    </div>
  );
}
