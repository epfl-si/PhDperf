import React, {useState} from 'react'
import {Errors, Form} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {Tasks} from '/imports/api/tasks'
import { Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Alert, Button, Loader} from "epfl-sti-react-library"
import {Link} from "react-router-dom"
import _ from "lodash";
import {findDisabledFields} from "/imports/lib/formIOUtils";
import { useHistory } from "react-router-dom";

export function Task({workflowKey}: { workflowKey: string }) {
  const taskLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, [workflowKey]);

  const task = useTracker(() => Tasks.findByKey(workflowKey), [workflowKey])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [meteorError, setMeteorError] = useState("")

  const history = useHistory()

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
            submitting ? <div>Submitting...</div>
              :
              (<>
                <h1 className={'h2'}>{task.customHeaders.title || `Task ${task._id}`}</h1>
                <Errors/>
                <Form form={JSON.parse(task.customHeaders.formIO)}
                      submission={{data: task.variables}}
                      noDefaultSubmitButton={true}
                      onSubmit={onSubmit}
                      onCustomEvent={(event: customEvent) => event.type == 'cancelClicked' && history.push('/')}
                />
              </>)
        }</>
      )
    }
  } else {
    // if task is no more, it can be that we already submitted it or a 404
    return (
      <>
        {
          submitted ?
            <>
              <Alert message={'Form submitted'} alertType={'success'}/>
              <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
            </>
            :
            <div>Unable to find the task no {workflowKey}</div>
        }
        {
          meteorError ?
            <Alert message={`Form not submitted because of an error ${meteorError}. Please try again later.`}
                   alertType={'danger'}/>
            : <></>
        }
      </>)
  }

  function onSubmit(this: any, formData: { data: any, metadata: any }) {
    // As formio sent all the form fields (disabled included)
    // we remove the "disabled" one, so we can control
    // the workflow variables with only the needed values
    const formDataPicked = _.omit(formData.data, findDisabledFields(this.form))

    setSubmitting(true)

    try {
      Meteor.call("submit",
        workflowKey,
        formDataPicked,
        formData.metadata,
      )
      setSubmitting(false)
      setSubmitted(true)
    } catch (error) {
      setSubmitting(false)
      setSubmitted(false)
      setMeteorError(error.message)
    }
  }
}
