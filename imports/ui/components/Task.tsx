import React from 'react'
import {Form, Errors} from '@formio/react'
import {PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
import {Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Button} from "epfl-sti-react-library"
import {Link} from "react-router-dom";

export function Task({workflowKey}: { workflowKey: string }) {
  useTracker(() => Meteor.subscribe('tasks'))
  const task = useTracker(() => PerfWorkflowTasks.findByKey(workflowKey))
  const formIoJson = task?.customHeaders?.form_io

  return (
    <>
      <h1>Task {workflowKey}</h1>
      <Errors/>
      {formIoJson ? (
        <Form form={JSON.parse(formIoJson as string)}
              noDefaultSubmitButton={true}
              onSubmit={onSubmit}
              onCustomEvent={e => e.type == 'cancelClicked' && window.history.go(-1)}
        />
      ) : (
        <>
          <p>Form submitted !</p>
          <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
        </>
      )
      }
    </>
  )

  function onSubmit(formData: { data: any, metadata: any }) {
    Meteor.call("submit",
      workflowKey,
      formData.data, formData.metadata,
      // TODO: make the form alive after submit with:
      // (error, result) => {},
    )
  }
}
