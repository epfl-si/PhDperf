import React, {useState} from 'react'
import {Errors, Form} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {Tasks} from '/imports/ui/model/tasks'
import {global_Error, Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Alert, Button, Loader} from "epfl-sti-react-library"
import {Link} from "react-router-dom"
import _ from "lodash";
import findDisabledFields from "/imports/lib/formIOUtils";
import { useHistory } from "react-router-dom";

export function Task({workflowKey}: { workflowKey: string }) {
  const taskLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, [workflowKey]);

  const task = Tasks.findByKey(workflowKey)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [meteorError, setMeteorError] = useState("")

  const history = useHistory()

  return (
    <>
      {
        !submitted ?
        task?.formIO ?
          taskLoading ? (<>
              <Loader message={'Fetching task...'}/>
            </>) :
            submitting ? <div>Submitting...</div>
              :
              (<>
                <h1 className={'h2'}>{task.title || `Task ${workflowKey}`}</h1>
                <Errors/>
                <Form form={JSON.parse(task.formIO)}
                      submission={{data: task.variables}}
                      noDefaultSubmitButton={true}
                      onSubmit={onSubmit}
                      onCustomEvent={(event: customEvent) => event.type == 'cancelClicked' && history.push('/')}
                />
              </>)
            :
            <div>Unable to find the requested task no {workflowKey}</div>
          :
            !meteorError ?
            <>
              <Alert message={'Form submitted'} alertType={'success'}/>
              <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
            </>
            : <Alert message={`Form not submitted because of an error ${meteorError}. Please retry again`} alertType={'danger'}/>
      }
    </>)

  function onSubmit(this: any, formData: { data: any, metadata: any }) {
    // As formio sent all the form fields (disabled included)
    // we remove the "disabled" one, so we can control
    // the workflow variables with only the needed values
    const formDataPicked = _.omit(formData.data, findDisabledFields(this.form))

    setSubmitting(true)

    Meteor.call("submit",
      workflowKey,
      formDataPicked,
      formData.metadata,
      (error: global_Error | Meteor.Error | undefined) => {
        setSubmitting(false)
        setSubmitted(true)
        if (error) {
          setMeteorError(error.message)
        }
      }
    )
  }
}
