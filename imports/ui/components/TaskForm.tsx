import React, {useEffect, useState} from 'react'
import {Errors, Form} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {Task, Tasks} from "/imports/model/tasks";
import {global_Error, Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Button, Loader} from "@epfl/epfl-sti-react-library"
import {Link, useNavigate} from "react-router-dom"
import _ from "lodash"
import {findDisabledFields} from "/imports/lib/formIOUtils";
import toast from 'react-hot-toast';
import {ErrorIcon} from "react-hot-toast/src/components/error";
import {toastClosable} from "/imports/ui/components/Toasters";
import {useAccountContext} from "/imports/ui/components/Account";


const TaskAdminInfo = ({ _id }: { _id: string }) => {
  const account = useAccountContext()

  const [showAdminInfo, setShowAdminInfo] = useState(false)
  const taskLoading = useTracker(() => {
    const handle = Meteor.subscribe('taskDetailed', [_id]);
    return !handle.ready();
  }, [_id]);

  const task = useTracker(() => Tasks.findOne({ _id:_id }), [_id])

  return (
    <>
      { !taskLoading && account?.user?.isAdmin && task &&
        <div>
          {showAdminInfo ?
            <>
              <div><a href={'#'} onClick={ () => setShowAdminInfo(false) }>Close</a></div>
              <div>Task last seen on Zeebe at { task.journal.lastSeen?.toLocaleString('fr-CH') }, { task.journal.seenCount }x</div>

            </> :
            <div>
              <a
                href={'#'}
                onClick={ () => setShowAdminInfo(true) }
              >Admin info</a>
            </div>
          }
        </div>
      }
    </>
  )
}

const TaskFormEdit = ({ _id }: { _id: string }) => {
  const account = useAccountContext()

  const [task, setTask] = useState<Task | undefined>()

  const [isSubmitted, setIsSubmitted] = useState(false)

  const toastId = `toast-${_id}`
  const navigate = useNavigate()

  // Remove the current notification
  useEffect(() => {
    toast.dismiss(toastId)
  });

  useEffect(() => {
    Meteor.apply(
      'getTaskForm',
      [_id],
      {
        wait: true,
        onResultReceived: (error: Error | Meteor.Error | undefined, result) => {
          if (error) {
            toast(
              toastClosable(toastId, `${error}`),
              {
                id: toastId,
                duration: Infinity,
                icon: <ErrorIcon />,
              }
            );
          } else {
            setTask(result as Task)
          }
        }
      },
    )
  }, [])

  if (isSubmitted) return (
    <>
      <div className={'alert alert-success'} role='alert'>{'Data submitted !'}</div>
      <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
    </>
  )

  if (!account || !account.isLoggedIn) return (<Loader message={'Loading your data...'}/>)

  if (!task) return (<Loader message={'Fetching task...'}/>)

  if (task) {
    if (!task.customHeaders.formIO) {
      return (<div>Task exists but is not well formed (has no formIO field). This state should not exist. Please contact 1234@epfl.ch about that problem.</div>)
    } else {
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
    }
  } else {
    // if task is no more, it can be that we already submitted it or a 404
    return (<>
      {!isSubmitted ? (
        <>
          <div className={'alert alert-success'} role='alert'>{'Data submitted !'}</div>
          <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
        </>
      ) : (
        <div>Unable to find the task no {_id}.<br/>
          Please try again or go <Link to={`/`}>back to the task list</Link>
        </div>
      )
      }</>)
  }

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
      _id,
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
  if (!account || !account.isLoggedIn) return (<Loader message={'Loading your data...'}/>)

  return (
    <div>
      <TaskAdminInfo _id={ _id } />
      <TaskFormEdit _id={ _id }/>
    </div>
  )
}
