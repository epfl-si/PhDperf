import React, {useEffect, useState, useRef} from 'react'
import {global_Error, Meteor} from 'meteor/meteor'
import {useTracker} from "meteor/react-meteor-data";
import {Errors, Form} from '@formio/react'
import {Link, useNavigate} from "react-router-dom"
import _ from "lodash"

import {Button, Loader} from "@epfl/epfl-sti-react-library"
import toast from 'react-hot-toast';

import {toastErrorClosable} from "/imports/ui/components/Toasters";
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
    <div className={ 'mb-4' }>
      <div>Task last seen on Zeebe at { task.journal.lastSeen?.toLocaleString('fr-CH') }, { task.journal.seenCount }x</div>
    </div>
  )
}

/*
 * Here is the React component that manage the form. It can
 *  - show and submit the form
 *  - automatically save an unfinished form. Unfinished form are created as blur event on inputs.
 *  - retrieve unfinished form on load.
 */
const TaskFormEdit = ({ task, onSubmitted }: { task: Task, onSubmitted: () => void }) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [unFinishedTask, setUnfinishedTask] = useState<undefined | any | null>()
  const localFormData = useRef({})

  const toastId = `toast-${task._id}`
  const navigate = useNavigate()

  // Remove the current notification
  useEffect(() => {
    toast.dismiss(toastId)
  });

  useEffect(() => {
    // load any unfinished session for this form, if any
    const getUnfinishedTask = async () => {
      const findingUnfinishedTask = await Meteor.callAsync('getUnfinishedTask', task._id) ?? null
      setUnfinishedTask(
        findingUnfinishedTask
      )

      if (Meteor.isDevelopment) {
        console.log("found a unfinsihed task : %j", findingUnfinishedTask)
        console.log("Compare it with task variables: %j", task.variables)
      }
    }
    getUnfinishedTask().catch(console.error)
  }, [task._id]);

  const onBlur = async (event: any) => {
    await saveAsUnfinishedTask(event._data)
  }

  const onChange = async (event: any) => {
    // keep only changed event, not all others changes
    if (!event.changed ) return

    // filter out the changes coming from TextAreaComponent.
    // The onBlur is better at it, as it does not trigger on every keyboard input.
    if (event.changed.component?.inputType === 'text') return

    // ok, we good for a save
    await saveAsUnfinishedTask(event.data)
  }

  const saveAsUnfinishedTask = async (data: any) => {
    // filter out well known uninteresting data
    const eventDataChanged = _.omit(data, [
      ...findDisabledFields(JSON.parse(task.customHeaders.formIO!)),
      'assigneeSciper',
      'submit',
      'cancel',
      'created_by',
      'created_at',
      'updated_at',
      ]
    )

    // only call server if something actually changed
    if (!_.isEqual(eventDataChanged, localFormData.current)) {
      if (Meteor.isDevelopment) {
        console.log("Calling server for change: %j", localFormData)
      }

      await Meteor.callAsync('saveAsUnfinishedTask', task._id, eventDataChanged)
      // once sent to server, keep a local value up to date too (for comparaisons)
      localFormData.current =_.cloneDeep(eventDataChanged)
    }
  };

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

  // check for undefined specifically, as it is null once loaded but without any value
  if (unFinishedTask === undefined)
    return (<Loader message={'Loading previous session if any...'}/>)

  return (
    <>
      <div className={ 'alert alert-info' }>Data is automatically saved each time a field is filled in</div>
      <h1 className={ 'h2 mt-4 mb-3' }>{task.customHeaders.title || `Task ${task._id}`}</h1>
      <Errors/>
      <Form
        form={ JSON.parse(task.customHeaders.formIO) }
        submission={
          // merge has to be best thought, it may be tricky with
          // what we change in zeebe and unfinished one that want to be the truth
          { data: _.merge( task.variables, unFinishedTask?.inputJSON ) }
        }
        onBlur={ onBlur }
        onChange={ onChange }
        onCustomEvent={ (event: customEvent) => event.type == 'cancelClicked' && navigate('/') }
        options={ { hooks: { beforeSubmit: beforeSubmitHook,} } }
      />
    </>
  )

  /*
   * Before submitting, assert we are connected, or raise an error, asking for a retry
   */
  function beforeSubmitHook(this: any, formData: { data: any, metadata: any }, next: any) {
    // get meteor status, if we are connected, submit is good, otherwise, well, open the toaster about it and leave the UI ready to be saved
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

/*
 * Get a list of keys of fields that are disabled
 */
function findDisabledFields(form: any) {
  let disabledFieldKeys: string[] = [];

  const rootComponents = form.components;

  const searchForDisabledFields = (components: []) => {
    components.forEach((element: any) => {
      if (element.key !== undefined &&
        element.disabled !== undefined &&
        element.disabled) {
        disabledFieldKeys.push(element.key);
      }

      if (element.components !== undefined) {
        searchForDisabledFields(element.components);
      }
    })
  };

  searchForDisabledFields(rootComponents);

  return disabledFieldKeys;
}
