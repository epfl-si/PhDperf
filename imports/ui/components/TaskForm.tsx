import React, {useEffect, useState} from 'react'
import {global_Error, Meteor} from 'meteor/meteor'
import {useTracker} from "meteor/react-meteor-data";
import {Errors, Form} from '@formio/react'
import {Link, useNavigate} from "react-router-dom"
import _ from "lodash"

import {Button, Loader} from "@epfl/epfl-sti-react-library"
import toast from 'react-hot-toast';
import {ErrorIcon} from "react-hot-toast/src/components/error";

import {toastClosable} from "/imports/ui/components/Toasters";
import {findDisabledFields} from "/imports/lib/formIOUtils";
import {customEvent} from '/imports/ui/model/formIo'
import {useAccountContext} from "/imports/ui/contexts/Account";
import {useConnectionStatusContext} from "/imports/ui/contexts/ConnectionStatus";
import {Task, Tasks} from "/imports/model/tasks";


const ConnectionStatusForSubmit = ({ task }: { task?: Task }) => {
  const connectionStatus = useConnectionStatusContext()

  // link toast id to the subscription connection
  const toastId = `toast-${task?._id}`
  const [hasDisconnected, setHasDisconnected] = useState(false)

  useEffect(() => {
    if (connectionStatus.ddp.status === 'offline') {
      setHasDisconnected(true)
      toast(
        toastClosable(toastId, 'It look like you lost connection to the server. Please save a backup of your form before trying to submit. Reconnecting...'),
        {
          id: toastId,
          duration: Infinity,
          icon: <ErrorIcon />,
        }
      );
    } else if (hasDisconnected && connectionStatus.ddp.status === 'connected') {
      toast.dismiss(toastId)
      setHasDisconnected(false)
      toast.success(
        'Reconnected to the server',
        { duration: 5000 }
      )
    }
  }, [connectionStatus.ddp.status])

  if (connectionStatus.ddp.status === 'connected')
    return (<></>)
  else {
    return (
      <div>
        <div
          className={'alert alert-danger'}
          role='alert'>
          <div>Connection to the server seems troublesome. Submitting is not guaranteed.</div>
          <div>Please take action to save your current form data.</div>
        </div>
      </div>
    )
  }
}

const TaskAdminInfo = ({ taskId }: { taskId: string }) => {
  const taskSubscriptionLoading = useTracker(() => {
    const handle = Meteor.subscribe('taskDetailed', [taskId]);
    return !handle.ready();
  }, [taskId]);

  const task = useTracker(() => Tasks.findOne({ '_id': taskId}), [taskId])

  const [showAdminInfo, setShowAdminInfo] = useState(false)

  if (taskSubscriptionLoading) return <Loader>Loading task admin info</Loader>

  if (!task) return <div>No task for {taskId}</div>

  return (
    <div>
      { showAdminInfo ?
        <>
          <div role="button" onClick={ () => setShowAdminInfo(false) }>Close</div>
          <div>Task last seen on Zeebe at { task.journal.lastSeen?.toLocaleString('fr-CH') }, { task.journal.seenCount }x</div>
        </>
        :
        <div role="button" onClick={ () => setShowAdminInfo(true) }>
          Admin info
        </div>
      }
    </div>
  )
}

const TaskFormEdit = ({ task }: { task: Task }) => {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const toastId = `toast-${task._id}`
  const navigate = useNavigate()

  // Remove the current notification
  useEffect(() => {
    toast.dismiss(toastId)
  });

  if (isSubmitted) return (
    <>
      <div className={'alert alert-success'} role='alert'>{'Data submitted !'}</div>
      <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
    </>
  )

  if (!task.customHeaders.formIO) return (
    <div>
      {'Task exists but is not well formed (has no formIO field). This state should not exist. Please contact 1234@epfl.ch about that problem.'}
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
    toast.loading("Submitting...",
      {
        id: toastId,
        duration: 10000,
      })

    // As formio sent all the form fields (disabled included)
    // we remove the "disabled" one, so we can control
    // the workflow variables with only the needed values
    const formDataPicked = _.omit(formData.data, findDisabledFields(this))

    Meteor.call("submit",
      task._id,
      formDataPicked,
      formData.metadata,
      (error: global_Error | Meteor.Error | undefined)  => {
        if (error) {
          toast(
            toastClosable(toastId, `${error}`),
            {
              id: toastId,
              duration: Infinity,
              icon: <ErrorIcon />,
            }
          );
          next(error)
        } else {
          toast.dismiss(toastId)
          setIsSubmitted(true)
          next()
        }
      }
    )
  }
}

export const TaskForm = ({ _id }: { _id: string }) => {
  const account = useAccountContext()

  const [task, setTask] = useState<Task | undefined>()
  const [taskFormLoading, setTaskFormLoading] = useState(true)

  useEffect(() => {
    Meteor.apply(
      'getTaskForm',
      [_id],
      {
        wait: true,
        onResultReceived: (error: Error | Meteor.Error | undefined, result) => {
          if (error) {
            setTaskFormLoading(false)
          } else {
            setTask(result as Task)
            setTaskFormLoading(false)
          }
        }
      },
    )
  }, [_id])

  if (!account || !account.isLoggedIn) return (<Loader message={'Loading your data...'}/>)
  if (taskFormLoading) return (<Loader message={'Loading the task form...'}/>)

  return (<>
    { task ? (
        <div>
          { account.user?.isAdmin &&
            <TaskAdminInfo taskId={ task._id! }/>
          }
          <TaskFormEdit task={ task }/>
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
    <ConnectionStatusForSubmit task={ task }/>
  </>)
}
