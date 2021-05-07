import React from 'react'
import {Form, Errors} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
import {Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Button, Loader, Alert} from "epfl-sti-react-library"
import {Link} from "react-router-dom";

export function Task({workflowKey}: { workflowKey: string }) {
  const taskLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, []);

  const task = useTracker(() => PerfWorkflowTasks.findByKey(workflowKey))
  const formIoJson = task?.customHeaders?.form_io

  return (
    <>
      {taskLoading ? (<>
        <Loader message={'Fetching task from server...'}/>
      </>) : (<>
        <h1>{task?.getName() || `Task ${workflowKey}`}</h1>
        <Errors/>
        {formIoJson ? (
          <Form form={JSON.parse(formIoJson as string)}
                noDefaultSubmitButton={true}
                onSubmit={onSubmit}
                onCustomEvent={(event: customEvent) => event.type == 'cancelClicked' && window.history.go(-1)}
          />) : (<>
          <Alert message={'Form submitted'} alertType={'success'}/>
          <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
        </>)}
      </>)}
    </>)

  function onSubmit(formData: { data: any, metadata: any }) {
    Meteor.call("submit",
      workflowKey,
      formData.data, formData.metadata,
      // TODO: make the form alive after submit with:
      // (error, result) => {},
    )
  }
}
