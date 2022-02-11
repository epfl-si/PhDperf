import React, {useState} from "react";
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {insertDoctoralSchool} from "/imports/api/doctoralSchools/methods"
import toast from "react-hot-toast"

type CreateParameter = {
  toggleCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CreateForm = ({toggleCreateForm}: CreateParameter) => {
  const [acronym, setAcronym] = useState("");
  const [label, setLabel] = useState("");
  const [helpUrl, setHelpUrl] = useState("")
  const [creditsNeeded, setCreditsNeeded] = useState("")
  const [programDirectorSciper, setProgramDirectorSciper] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    insertDoctoralSchool.call({
        acronym: acronym.trim(),
        label: label.trim(),
        helpUrl: helpUrl.trim(),
        creditsNeeded: Number(creditsNeeded.trim()),
        programDirectorSciper: programDirectorSciper?.trim(),
      } as DoctoralSchool, (err: any) => {
        if (err) {
          toast.error(`${err.message}`)
        } else {
          // success!
          toast.success('New doctoral school created')
          setAcronym("")
          setLabel("")
          setHelpUrl("")
          setCreditsNeeded("")
          setProgramDirectorSciper("")
          toggleCreateForm(false)
        }
      }
    )
  }

  return (
    <form className="doctoral-programs-form" onSubmit={handleSubmit}>
      <div className="form-group">

        <label htmlFor="acronymInput" className={"field-required"}>Acronym</label>
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
        <label htmlFor="labelInput" className={"field-required"}>Label</label>
        <input
          id="labelInput"
          className="form-control"
          type="text"
          placeholder="Type to add the new label"
          value={ label }
          onChange={ (e) => setLabel(e.target.value) }
        />
      </div>
      <div className="form-group">
        <label htmlFor="helpUrlInput" className={"field-required"}>Link to the annual report documentation</label>
        <input
          id="helpUrlInput"
          className="form-control"
          type="text"
          placeholder="Type to add the help url"
          value={ helpUrl }
          onChange={ (e) => setHelpUrl(e.target.value) }
        />
      </div>
      <div className="form-group">
        <label htmlFor="creditsNeededInput" className={"field-required"}>Credits needed</label>
        <input
          id="creditsNeededInput"
          className="form-control"
          type="text"
          placeholder="Type to add the credits needed"
          value={ creditsNeeded }
          onChange={ (e) => setCreditsNeeded(e.target.value) }
        />
      </div>
      <div className="form-group">
        <label htmlFor="programDirectorSciperInput" className={"field-required"}>Program Director Sciper</label>
        <input
          id="programDirectorSciperInput"
          className="form-control"
          type="text"
          placeholder="Type to add the program director sciper"
          value={ programDirectorSciper }
          onChange={ (e) => setProgramDirectorSciper(e.target.value) }
        />
      </div>
      <button type="submit" className="btn btn-primary">Add</button>
      <button type="button" className="btn btn-secondary ml-2" onClick={() => toggleCreateForm(false)}>Cancel</button>
    </form>
  )
}
