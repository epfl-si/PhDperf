import React, {useEffect, useState} from 'react'
import {Errors, Form} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {Tasks} from "/imports/model/tasks";
import {global_Error, Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Button, Loader} from "@epfl/epfl-sti-react-library"
import {Link, useNavigate} from "react-router-dom"
import _ from "lodash"
import {findDisabledFields} from "/imports/lib/formIOUtils";
import toast from 'react-hot-toast';
import {ErrorIcon} from "react-hot-toast/src/components/error";
import {toastClosable} from "/imports/ui/components/Toasters";


export const Task = ({ _id }: { _id: string }) => {
  const taskLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('taskDetailed', [_id]);
    return !handle.ready();
  }, [_id]);

  const task = useTracker(() => Tasks.findOne({ _id:_id }), [_id])
  const toastId = `toast-${_id}`
  const [toBeSubmitted, setToBeSubmitted] = useState<boolean | undefined>(true)
  const navigate = useNavigate()

  // Remove the current notification
  useEffect(() => {
    toast.dismiss(toastId)
  });

  if (task) {
    if (!task.customHeaders.formIO) {
      return (<div>Task exists but is not well formed (has no formIO field). Check with your administrator that the BPMN file is well formatted</div>)
    } else {
      return (
        <>{
          taskLoading ? (<>
              <Loader message={'Fetching task...'}/>
            </>)
            :
            (<>
              <h1 className={'h2'}>{task.customHeaders.title || `Task ${task._id}`}</h1>
              <Errors/>
              <Form form={ JSON.parse(task.customHeaders.formIO) }
                    submission={ {data: task.variables} }
                    onCustomEvent={ (event: customEvent) => event.type == 'cancelClicked' && navigate('/') }
                    options={ { hooks: { beforeSubmit: beforeSubmitHook,} } }
              />
            </>)
        }</>
      )
    }
  } else {
    // if task is no more, it can be that we already submitted it or a 404
    return (<>
      {!toBeSubmitted ? (
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
          setToBeSubmitted(undefined)
          next()
        }
      }
    )
  }
}
