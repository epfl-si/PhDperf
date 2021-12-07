import React, {useState} from "react"
import {useTracker} from "meteor/react-meteor-data";
import {Meteor} from "meteor/meteor";
import {canAccessDoctoralSchoolEdition} from "/imports/policy/doctoralSchools";
import {Loader} from "@epfl/epfl-sti-react-library";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools";
import EasyEdit, {Types} from 'react-easy-edit';

type CreateParameter = {
  toggleCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
};

const CreateForm = ({toggleCreateForm}: CreateParameter) => {
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
      <button type="submit" className="btn btn-primary">Add a doctoral school</button>
      <button type="button" className="btn btn-secondary ml-2" onClick={() => toggleCreateForm(false)}>Cancel</button>
    </form>
  )
}

type DoctoralSchoolEditParameter = {
  doctoralSchool: DoctoralSchool;
};

const InlineEdit = ({ doctoralSchool }: DoctoralSchoolEditParameter) => {
  const [editMode, setEditMode] = useState(false)
  const [acronym, setAcronym] = useState(doctoralSchool.acronym)
  const [label, setLabel] = useState(doctoralSchool.label)
  const [helpUrl, setHelpUrl] = useState(doctoralSchool.helpUrl)
  const [creditsNeeded, setCreditsNeeded] = useState(doctoralSchool.creditsNeeded?.toString())
  const [programDirectorSciper, setProgramDirectorSciper] = useState(doctoralSchool.programDirectorSciper)

  const saveEdit = () => {
    Meteor.call('updateDoctoralSchool', {
        _id: doctoralSchool._id,
        acronym: acronym.trim(),
        label: label.trim(),
        helpUrl: helpUrl?.trim(),
        creditsNeeded: creditsNeeded?.trim() ? Number(creditsNeeded.trim()): undefined,
        programDirectorSciper: programDirectorSciper?.trim(),
      } as DoctoralSchool
    )
  }

  return (
    <>
      <hr />
      <div className={'m-2'}>
        <EasyEdit
            value={ acronym }
            type={Types.TEXT}
            editMode={editMode}
            onSave={ (e: React.ChangeEvent<HTMLInputElement>) => {
              setAcronym(e.target.value)
              saveEdit()
            }}
            onCancel={() => void 0 }
            saveButtonLabel="Save"
            cancelButtonLabel="Cancel"
            attributes={{ name: "doctoralSchool-acronym-edit-input", id: `doctoralSchool-acronym-edit-input-${doctoralSchool._id}`}}
            instructions="The doctoral school acronym"
            onValidate={ (value: string) => value != null }
        />
        <EasyEdit
            value={ label }
            type={Types.TEXT}
            editMode={editMode}
            onSave={(e: React.ChangeEvent<HTMLInputElement>) => {
              setLabel(e.target.value)
              saveEdit()
            }}
            onCancel={() => void 0 }
            saveButtonLabel="Save"
            cancelButtonLabel="Cancel"
            attributes={{ name: "doctoralSchool-label-edit-input", id: `doctoralSchool-label-edit-input-${doctoralSchool._id}`}}
            instructions="The doctor school label. It will be used as the GED folder"
            onValidate={ (value: string) => value != null }
        />
        <EasyEdit
            value={ helpUrl }
            type={Types.TEXT}
            editMode={editMode}
            onSave={(e: React.ChangeEvent<HTMLInputElement>) => {
              setHelpUrl(e.target.value)
              saveEdit()
            }}
            onCancel={() => void 0 }
            saveButtonLabel="Save"
            cancelButtonLabel="Cancel"
            attributes={{ name: "doctoralSchool-helpUrl-edit-input", id: `doctoralSchool-helpUrl-edit-input-${doctoralSchool._id}`}}
            instructions="The doctor school help URL."
            onValidate={ (value: string) => value != null }
            placeholder={ helpUrl ?? "<Help URL>"}
        />
        <EasyEdit
            value={ creditsNeeded }
            type={Types.TEXT}
            editMode={editMode}
            onSave={(e: React.ChangeEvent<HTMLInputElement>) => {
              setCreditsNeeded(e.target.value)
              saveEdit()
            }}
            onCancel={() => void 0 }
            saveButtonLabel="Save"
            cancelButtonLabel="Cancel"
            attributes={{ name: "doctoralSchool-creditsNeeded-edit-input", id: `doctoralSchool-creditsNeeded-edit-input-${doctoralSchool._id}`}}
            instructions="The doctor school credits needed."
            onValidate={ (value: string) => value != null && Number.isInteger(parseInt(value)) }
            placeholder={ creditsNeeded ?? "<Credits Needed>"}
        />
        <EasyEdit
            value={ programDirectorSciper }
            type={Types.TEXT}
            editMode={editMode}
            onSave={(e: React.ChangeEvent<HTMLInputElement>) => {
              debugger
              setProgramDirectorSciper(e.target.value)
              saveEdit()
            }}
            onCancel={() => void 0 }
            saveButtonLabel="Save"
            cancelButtonLabel="Cancel"
            attributes={{ name: "doctoralSchool-programDirectorSciper-edit-input", id: `doctoralSchool-programDirectorSciper-edit-input-${doctoralSchool._id}`}}
            instructions="The doctor school program director sciper."
            onValidate={ (value: string) => value != null }
            placeholder={ programDirectorSciper ?? "<Program Director Sciper>"}
        />

        <button onClick={() => {
            setEditMode(!editMode);
          }}
        >Edit</button>
      </div>
    </>
  )
}

export function DoctoralSchoolsForm() {
  const [showAdd, setShowAdd] = useState(false)

  const userLoaded = !!useTracker(() => {
    return Meteor.user();
  }, []);

  const doctoralSchoolsLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('doctoralSchools');
    return !handle.ready();
  }, []);

  const doctoralSchoolsData = useTracker(
      () => DoctoralSchools.find({}).fetch()
  ) as DoctoralSchool[]

  if (!userLoaded) return (<div>Loading user</div>)
  if (userLoaded && !canAccessDoctoralSchoolEdition()) return (<div>Your permission does not allow you to see the dashboard </div>)

  return (
    <>
      {doctoralSchoolsLoading ? (
        <Loader message={'Loading doctoral schools data...'}/>
      ) : (
          doctoralSchoolsData.length === 0 ? (
            <>
              {
                !showAdd &&
                <a href={"#"} onClick={() => setShowAdd(showAdd => !showAdd)}> Add a doctoral school</a>
              }
              <div>There is currently no doctoralSchoolsData</div>
            </>
        ) : (<>
          {
            !showAdd &&
            <a href={"#"} onClick={() => setShowAdd(showAdd => !showAdd)}> Add a doctoral school</a>
          }
          {
            showAdd &&
            <CreateForm toggleCreateForm={ setShowAdd }/>
           }
          <div>
          {
            doctoralSchoolsData.map((doctoralSchool) =>
              <InlineEdit key={doctoralSchool._id} doctoralSchool={ doctoralSchool } />
            )
          }
          </div>
          </>
        )
      )}
    </>
  )
}
