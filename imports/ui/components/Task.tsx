import React, {useEffect, useState} from 'react'
import {Errors, Form} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {Tasks} from '/imports/api/tasks'
import {global_Error, Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Alert, Button, Loader} from "@epfl/epfl-sti-react-library"
import {Link} from "react-router-dom"
import _ from "lodash"
import {findDisabledFields} from "/imports/lib/formIOUtils";
import { useHistory } from "react-router-dom";
import toast from 'react-hot-toast';
import {ErrorIcon} from "react-hot-toast/src/components/error";
import {toastClosable} from "/imports/ui/components/Toasters";


export function Task({workflowKey}: { workflowKey: string }) {
  const taskLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, [workflowKey]);

  const task = useTracker(() => Tasks.findByKey(workflowKey), [workflowKey])
  const toastId = `toast-${workflowKey}`
  const [submitted, setSubmitted] = useState(false)
  const history = useHistory()

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
                    onCustomEvent={ (event: customEvent) => event.type == 'cancelClicked' && history.push('/') }
                    options={ { hooks: { beforeSubmit: beforeSubmitHook,} } }
              />
            </>)
        }</>
      )
    }
  } else {
    // if task is no more, it can be that we already submitted it or a 404
    return (<>
      {submitted ? (
        <>
          <Alert message={'Data submitted !'} alertType={'success'}/>
          <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
        </>
      ) : (
        <div>Unable to find the task no {workflowKey}.<br/>
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
      workflowKey,
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
          setSubmitted(true)
          next()
        }
      }
    )
  }
}
