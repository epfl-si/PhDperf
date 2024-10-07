import React, {useState} from "react";
import {Task} from "/imports/model/tasks";
import {Loader} from "@epfl/epfl-sti-react-library";
import {ParticipantRoles} from "/imports/model/participants";


export const EditParticipants = ({ tasks }: { tasks: Task[] }) => {
  const [submitting, setSubmitting] = useState(false)
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [role, setRole] = useState('')
  const [sciper, setSciper] = useState('')

  const task = tasks[0]

  if (errorMessage) return <div>
    <div>Error: { errorMessage }</div>
    <div>
      <a
        onClick={ () => {
          setErrorMessage('')
        } }
        href={ '#' }
      >Try again</a>
    </div>
  </div>

  if (!task) {
    if (hasBeenSubmitted) {
      return <Loader message={ 'Wait some times, the task is being refreshed' }/>
    } else {
      return <div>No such task with a processInstanceKey: { tasks[0].processInstanceKey }</div>
    }
  }

  if (!task?.variables.uuid) return <div>This task has no uuid and can not be edited</div>

  if (submitting) return <Loader message={ 'Changing a participant...' }/>

  const submitParticipantsChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitting(true)
    try {
      await Meteor.callAsync(
        'updateTaskParticipants',
        task!._id,
        { role: role, sciper: sciper }
      )
      setHasBeenSubmitted(true)
    } catch (e: any) {
      setErrorMessage(e.message)
    } finally {
      setRole('')
      setSciper('')
      setSubmitting(false)
    }
  }

  return <>
    <form id="edit-participants-form" onSubmit={ submitParticipantsChanges }>
      <div className="form-group">

        <select
          name="role"
          id="role"
          className="custom-select"
          onChange={ e => setRole(e.target.value) }
          defaultValue={ role }
          required={ true }
        >
          <option></option>
          { Object.values(ParticipantRoles)
                  .filter(p => p != 'phdStudent')
                  .map((participant) =>
                    <option
                      key={ participant }
                      value={ participant }>
                      { `${ participant } ${ task.participants?.[participant]?.sciper ? '👤' : '' } \
                 ${ task.participants?.[participant]?.name ?? '' } \
                 (${ task.participants?.[participant]?.sciper ?? 'Not set' })`
                      }
                    </option>
                  ) }
        </select>
        <label
          htmlFor={ `participant-sciper` }
          className={
            (role === 'thesisCoDirector') ? "mt-2" : "field-required mt-2"
          }
        >New sciper</label>
        <input
          id={ `participant-sciper` }
          name={ `sciper` }
          className="form-control"
          type="text"
          pattern="\d*"
          maxLength={ 6 }
          minLength={ 6 }
          value={ sciper }
          onChange={ e => setSciper(e.target.value) }
          required={
            role !== 'thesisCoDirector'
          }
        />
      </div>
      <button type="submit" className="btn btn-primary">Change & refresh</button>
    </form>
  </>
}
