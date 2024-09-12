import {useAccountContext} from "/imports/ui/contexts/Account";
import React, {useEffect, useState} from "react";
import {Task} from "/imports/model/tasks";
import {Loader} from "@epfl/epfl-sti-react-library";
import DueDatePicker from "/imports/ui/components/Task/DueDatePicker";
import {canEditProcessInstanceVariables} from "/imports/policy/processInstance";
import toast from "react-hot-toast";
import {global_Error, Meteor} from "meteor/meteor";
import dayjs from "dayjs";
import {Button} from "react-bootstrap";


export const EditVariables = ({ task }: { task: Task }) => {
  const account = useAccountContext()

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [dueDate, setDueDate] = useState<Date | undefined>(
     task.variables?.dueDate ?
       new Date(task.variables.dueDate) : undefined
  )

  useEffect(() => {
    setDueDate(
      task.variables?.dueDate ?
      new Date(task.variables.dueDate) : undefined
    )
  }, [task])

  if (!account?.user) return <Loader message={ 'Loading your data...' }/>

  if (!canEditProcessInstanceVariables(account.user)) return <div>{ 'Sorry, you do not have the permission to edit participants' }</div>

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

  if (!task) return <div>No task</div>

  if (!task.variables.uuid) return <div>This task has no uuid and can not be edited</div>

  if (submitting) return <Loader message={ 'Editing a variable...' }/>

  const submitVariablesChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitting(true)
    await toast.promise(
      Meteor.callAsync(
        'updateZeebeInstanceVariables',
        {
          processInstanceKey: task!.processInstanceKey,
          newVariables: { 'dueDate': dueDate }
        }
      ),
      {
        loading: 'Setting the due date...',
        success: () => {
          setSubmitting(false)
          return `The new due date has been set.`
        },
        error: (error) => {
          setSubmitting(false)
          return `${ error as global_Error | Meteor.Error }`
        },
      },
      {
        style: {
          minWidth: '280px',
        },
      })

  }

  return <>
    <form id="edit-variables-form" onSubmit={ submitVariablesChanges }>
      <div className="form-group">
        <div>Current due date:
          <span>
            { task.variables.dueDate ? ` ${dayjs(task.variables.dueDate).format('DD.MM.YYYY')}` : '' }
          </span>
        </div>
        <DueDatePicker
          value={ dueDate }
          futureOnly={ false }
          isNeeded={ false }
          setDueDateCallback={ setDueDate }
          label={ 'New due date' }
        />
      </div>
      <Button
        type="submit"
        className="btn btn-primary mt-3"
        disabled={ JSON.stringify(task.variables.dueDate) == JSON.stringify(dueDate) }
      >
        Update
      </Button>
    </form>
  </>
}
