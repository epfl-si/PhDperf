import React, {useEffect, useState} from "react";
import {Task} from "/imports/model/tasks";
import {Loader} from "@epfl/epfl-sti-react-library";
import DueDatePicker from "/imports/ui/components/Task/DueDatePicker";
import toast from "react-hot-toast";
import {global_Error, Meteor} from "meteor/meteor";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat"
import {Button} from "react-bootstrap";


// plugin to parse string as Date
dayjs.extend(customParseFormat);

/**
 * Convert our variables that are in string format to a date object, like dueDate
 * @param dateString a string like '01.01.2001'
 */
const fromStringToDate = (dateString: string) => dayjs(dateString, 'DD.MM.YYYY').toDate()

export const EditVariables = ({ task }: { task: Task }) => {
  const [submitting, setSubmitting] = useState(false)

  const [dueDate, setDueDate] = useState<Date | undefined>(
     task.variables?.dueDate ?
       fromStringToDate(task.variables.dueDate) : undefined
  )

  useEffect(() => {
    setDueDate(
      task.variables?.dueDate ?
        fromStringToDate(task.variables.dueDate) : undefined
    )
  }, [task])

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
          newVariables: {
            'dueDate': dueDate ?
              `${ ("0" + dueDate.getDate()).slice(-2) }.${ ("0" + (dueDate.getMonth() + 1)).slice(-2) }.${ dueDate.getFullYear() }` :
              undefined
          }
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
        <div>Current due date:&nbsp;
          <span>
            { task.variables.dueDate ?
              `${ dayjs(fromStringToDate(task.variables.dueDate)).format('DD.MM.YYYY') }` :
              ''
            }
          </span>
        </div>
        <DueDatePicker
          value={ dueDate }
          futureOnly={ true }
          isNeeded={ false }
          setDueDateCallback={ setDueDate }
          label={ 'New due date' }
        />
      </div>
      <Button
        type="submit"
        className="btn btn-primary mt-3"
        disabled={ !dueDate || JSON.stringify(task.variables.dueDate) == JSON.stringify(dueDate) }
      >
        Update
      </Button>
    </form>
  </>
}
