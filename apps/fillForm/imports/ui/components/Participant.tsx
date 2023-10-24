import React, {useState} from "react"
import {ParticipantDetail, ParticipantIDs} from "/imports/model/participants";
import {Tasks} from "/imports/model/tasks";
import {Loader} from "@epfl/epfl-sti-react-library";
import {useSubscribe, useTracker} from "meteor/react-meteor-data";
import {useAccountContext} from "/imports/ui/contexts/Account";
import {canEditParticipants} from "/imports/policy/tasks";


const allGoodBoxColor = 'bg-info text-white'
const awaitingBoxColor = 'bg-awaiting text-white'

export type ParticipantsInfo = {
  role: string
  info?: ParticipantDetail
  isAssignee?: boolean  // is the current user the one awaited to fullfil the task
  showEmail?: boolean
}

const camelCaseToLabel = (text: string) => text.replace(/([A-Z])/g, ' $1').replace(/^./, function(str: string){ return str.toUpperCase(); })

export const Participant = React.memo(
  ({role, info, isAssignee, showEmail = false}: ParticipantsInfo) =>
  <>
    {info &&
    <div className={`participant border col m-1 p-2 ${ isAssignee ? awaitingBoxColor : allGoodBoxColor}` }>
      <div className={`small border-bottom border-white`}>{ camelCaseToLabel(role) }</div>
      <div className={`small`}>{ info.name } ({ info.sciper })</div>
      { showEmail &&
        <div className={`small`}>{ info.email }</div>
      }
    </div>
    }
  </>
)

export const EditParticipants = ({ processInstanceKey }: { processInstanceKey: string }) => {
  const account = useAccountContext()

  const [submitting, setSubmitting] = useState(false)
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [role, setRole] = useState('')
  const [sciper, setSciper] = useState('')

  const isTaskLoading = useSubscribe('taskDetailed', [processInstanceKey]);
  const task = useTracker(() => Tasks.findOne({ 'processInstanceKey': processInstanceKey}), [processInstanceKey])

  if (!account?.user) return <Loader message={'Loading your data...'}/>

  if (!canEditParticipants(account.user)) return <div>{ 'Sorry, you do not have the permission to edit participants' }</div>

  if (errorMessage) return <div>
    <div>Error: { errorMessage }</div>
    <div>
      <a
        onClick={ () => {
          setErrorMessage('')
        }}
        href={'#'}
      >Try again</a>
    </div>
  </div>

  if (isTaskLoading()) return <Loader message={'Loading the task...'}/>

  if (!task) {
    if (hasBeenSubmitted) {
      return <Loader message={ 'Wait some times, the task is being refreshed' }/>
    } else {
      return <div>No such task with a processInstanceKey: { processInstanceKey }</div>
    }
  }

  if (!task?.variables.uuid) return <div>This task has no uuid and can not be edited</div>

  if (submitting) return <Loader message={'Changing a participant...'}/>

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
      <div>
        <h1 className={'h3'}>Change a participant</h1>
      </div>
      <hr/>
      <form id="edit-participants-form" onSubmit={submitParticipantsChanges}>
        <div className="form-group">
          <label htmlFor="role">Participant</label>

          <select
            name="role"
            id="role"
            className="custom-select"
            onChange={ e => setRole(e.target.value) }
            defaultValue={ role }
            required={ true }
          >
            <option> </option>
            { ParticipantIDs
                .filter(p => p != 'phdStudent')
                .map((participant) =>
              <option key={ participant } value={ participant }>{ participant }</option>
            )}
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
