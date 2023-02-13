import React, {useEffect, useState} from 'react'
import {global_Error, Meteor} from 'meteor/meteor'
import {useTracker} from "meteor/react-meteor-data";
import {Errors, Form} from '@formio/react'
import {Link, useNavigate} from "react-router-dom"
import _ from "lodash"

import {Button, Loader} from "@epfl/epfl-sti-react-library"
import toast from 'react-hot-toast';

import {toastErrorClosable} from "/imports/ui/components/Toasters";
import {findDisabledFields} from "/imports/lib/formIOUtils";
import {customEvent} from '/imports/ui/model/formIo'
import {Task, Tasks} from "/imports/model/tasks";


/**
 * Monitor the task, to reflect to the UI when the task was loaded but is not anymore later.
 * It can happen when multiple assignee are working on the same time on a task
 */
const TaskMonitor = ({ task }: { task: Task }) => {
  const taskSubscriptionLoading = useTracker(() => {
    const handle = Meteor.subscribe('taskDetailed', [task?._id]);
    return !handle.ready();
  }, [task]);

  const taskMonitored = useTracker(() => Tasks.findOne({ '_id': task._id}), [task])
  const toastId = `toast-${taskMonitored?._id}`

  if (!taskSubscriptionLoading && !taskMonitored) {
    toastErrorClosable(toastId,
      `The form has been submitted elsewhere or does not exist anymore.
       If needed, please take the appropriate actions to save your current form data.`)
  }

  // this component as nothing to draw, it's only here for the toast :)
  return (<></>)
}

const TaskAdminInfo = ({ taskId }: { taskId: string }) => {
  const taskSubscriptionLoading = useTracker(() => {
    const handle = Meteor.subscribe('taskDetailed', [taskId]);
    return !handle.ready();
  }, [taskId]);

  const task = useTracker(() => Tasks.findOne({ '_id': taskId}), [taskId])

  if (taskSubscriptionLoading) return <Loader>Loading task admin info</Loader>

  if (!task) return <></>

  return (
    <div>
      <div>Task last seen on Zeebe at { task.journal.lastSeen?.toLocaleString('fr-CH') }, { task.journal.seenCount }x</div>
    </div>
  )
}

const TaskFormEdit = ({ task, onSubmitted }: { task: Task, onSubmitted: () => void }) => {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const toastId = `toast-${task._id}`
  const navigate = useNavigate()

  // Remove the current notification
  useEffect(() => {
    toast.dismiss(toastId)
  });

  if (isSubmitted) return (
    <>
      <div className={'alert alert-success'} role='alert'>{'Data successfully submitted.'}</div>
      <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
    </>
  )

  if (!task.customHeaders.formIO) return (
    <div>
      {'Task exists but is not well formed (has no formIO field). Please contact 1234@epfl.ch about that problem.'}
    </div>
  )

  return (
    <>
      <h1 className={'h2'}>{task.customHeaders.title || `Task ${task._id}`}</h1>
      <Errors/>
      <Form form={ JSON.parse(task.customHeaders.formIO) }
        submission={ {data: task.variables} }
        onCustomEvent={ (event: customEvent) => event.type == 'cancelClicked' && navigate('/') }
        options={ { hooks: { beforeSubmit: beforeSubmitHook,} } }
      />
    </>
  )

  function beforeSubmitHook(this: any, formData: { data: any, metadata: any }, next: any) {
    // get meteor status, if we are connected, submnit is good, otherwise, well, open the toaster about it and leave the UI ready to be saved
    if (Meteor.status()?.status === "connected") {
      toast.loading("Submitting...",
        {
          id: toastId,
          duration: 10000,
        })

      // As formio sent all the form fields (disabled included)
      // we remove the "disabled" one, so we can control
      // the workflow variables with only the needed values
      const formDataPicked = _.omit(formData.data, findDisabledFields(this))

      Meteor.apply(
        'submit',
        [
          task._id,
          formDataPicked,
          formData.metadata
        ],
        {
          wait: true,
          onResultReceived: (error: global_Error | Meteor.Error | undefined) => {
            if (error) {
              toastErrorClosable(toastId, `${error}`)
              next(error.message)
            } else {
              toast.dismiss(toastId)
              setIsSubmitted(true)
              onSubmitted()  // call the event that the submit has been done successfully
              next()
            }
          }
        }
      )
    } else {  // meteor status is not connected, that's not very good, time to alarm the user that something is fishy
      const errorDisconnected = `The server is currently not able to accept your submission.
      You can keep the form open and try again later. It is recommended to save your essentials information before closing the window.`
      next(errorDisconnected)
    }
  }
}

/**
 * As the form is not MeteorReactive (no useTracker), we separate the loading from the component that uses live states
 */
export const TaskForm = ({ _id }: { _id: string }) => {
  const user = Meteor.user() // don't use accountProvider here, as we don't want to have a resetting form on user connection

  const [task, setTask] = useState<Task | undefined>()
  const [taskFormLoading, setTaskFormLoading] = useState(true)
  const [taskSubmitted, setTaskSubmitted] = useState(false)
  const [taskLoadingError, setTaskLoadingError] = useState< Error | Meteor.Error | undefined>()

  const onSubmit = () => {
    setTaskSubmitted(true)
  }

  useEffect(() => {
    Meteor.apply(
      'getTaskForm',
      [_id],
      {
        wait: true,
        onResultReceived: (error: Error | Meteor.Error | undefined, result) => {
          if (error) {
            setTask(undefined)
            setTaskFormLoading(false) // to remove
            setTaskLoadingError(error)
          } else {
            setTask(result as Task)
            setTaskFormLoading(false)  // to remove
          }
        }
      },
    )
  }, [_id])

  if (!user) return (<Loader message={'Loading your data...'}/>)
  if (taskFormLoading) return (<Loader message={'Loading the task form...'}/>)

  if (taskLoadingError) return (
    <div>
      <div className={'h3'}>Oops</div>
      { taskLoadingError instanceof Meteor.Error && taskLoadingError.reason ?
        <div>{taskLoadingError.reason}</div> :
        <div>{taskLoadingError.message}</div>
      }
        <br/>
        <div>Please try again or go <Link to={`/`}>back to the task list</Link></div>
    </div>
  )

  return (<>
    { task ? (
        <div>
          { !taskSubmitted &&
            <TaskMonitor task={task}/>
          }
          { user?.isAdmin &&
            <TaskAdminInfo taskId={ task._id! }/>
          }
          <TaskFormEdit task={ task } onSubmitted={ onSubmit } />
        </div>
      ) : (
        <>
          <div>
            Unable to find the task no {_id}.<br/>
            Please try again or go <Link to={`/`}>back to the task list</Link>
          </div>
        </>
      )
    }
  </>)
}
