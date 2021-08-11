import React from 'react'
import {Errors, Form} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
import {Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Loader} from "epfl-sti-react-library"
/*
import {Alert, Button, Loader} from "epfl-sti-react-library"
import {Link} from "react-router-dom"
*/
import _ from "lodash";
import findDisabledFields from "/imports/lib/formIOUtils";

export function Task({workflowKey}: { workflowKey: string }) {
  const taskLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, [workflowKey]);

  const task = useTracker(() => PerfWorkflowTasks.findByKey(workflowKey), [workflowKey])

  return (
    <>
      {
        task?.formIO ?
        taskLoading ? (<>
          <Loader message={'Fetching task...'}/>
        </>) : (<>
          <h1 className={'h2'}>{task.title || `Task ${workflowKey}`}</h1>
          <Errors/>
          <Form form={JSON.parse(task.formIO)}
                submission={ { data: task.variables }}
                noDefaultSubmitButton={true}
                onSubmit={onSubmit}
                onCustomEvent={(event: customEvent) => event.type == 'cancelClicked' && window.history.go(-1)}
          />
        </>)
      :
      (<div>Unable to find the requested task no {workflowKey}</div>)
      }
    </>)

  /*
  (<>
          <Alert message={'Form submitted'} alertType={'success'}/>
          <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
        </>)
   */

  function onSubmit(this: any, formData: { data: any, metadata: any }) {
    // As formio sent all the form fields (disabled included)
    // we remove the "disabled" one, so we can control
    // the workflow variables with only the needed values
    const formDataPicked = _.omit(formData.data, findDisabledFields(this.form))

    Meteor.call("submit",
      workflowKey,
      formDataPicked,
      formData.metadata
    )
  }
}
