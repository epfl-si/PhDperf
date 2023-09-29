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

export const EditParticipants = ({ _id }: { _id: string }) => {
  const account = useAccountContext()

  const [submitting, setSubmitting] = useState(false)
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [role, setRole] = useState('')
  const [sciper, setSciper] = useState('')

  const isTaskLoading = useSubscribe('taskDetailed', [_id]);
  const task = useTracker(() => Tasks.findOne({ '_id': _id}), [_id])

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
    if (hasBeenSubmitted) return <Loader message={'Wait some times, the task is being refreshed'}/>
    if (!hasBeenSubmitted) return <div>No such task with id: { _id }</div>
  }

  if (submitting) return <Loader message={'Submitting...'}/>

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
        <div className="row">
          {task!.participants &&
            Object.entries(task!.participants).map(([role, info]) =>
              <Participant
                key={ `${task!._id}-${role}` }
                role={ role }
                info={ info }
                isAssignee={ task!.assigneeScipers?.includes(info?.sciper) }
                showEmail={ true }
              />
            )
          }
        </div>
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
            className={ "field-required mt-2" }
          >New sciper</label>
          <input
            id={ `participant-sciper` }
            name={ `sciper` }
            className="form-control"
            type="text"
            value={ sciper }
            onChange={ e => setSciper(e.target.value) }
          />
        </div>
      <button type="submit" className="btn btn-primary">Change & refresh</button>
    </form>
  </>
}
