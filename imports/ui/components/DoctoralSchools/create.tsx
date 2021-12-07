import React, {useState} from "react";
import {Meteor} from "meteor/meteor";
import {DoctoralSchool} from "/imports/api/doctoralSchools";

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

    if (!acronym?.trim() || !label?.trim()) {
      alert('Please set at least the acronym and the label')
      return
    }

    Meteor.call('insertDoctoralSchool', {
        acronym: acronym.trim(),
        label: label.trim(),
        helpUrl: helpUrl?.trim(),
        creditsNeeded: creditsNeeded?.trim() ? Number(creditsNeeded.trim()): undefined,
        programDirectorSciper: programDirectorSciper?.trim(),
      } as DoctoralSchool
    )

    toggleCreateForm(false)
    setAcronym("")
    setLabel("")
    setHelpUrl("")
    setCreditsNeeded("")
    setProgramDirectorSciper("")
  }

  return (
    <form className="doctoral-schools-form" onSubmit={handleSubmit}>
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
        <label htmlFor="helpUrlInput">Help URL</label>
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
        <label htmlFor="creditsNeededInput">Credits needed</label>
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
        <label htmlFor="programDirectorSciperInput">Program Director Sciper</label>
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
