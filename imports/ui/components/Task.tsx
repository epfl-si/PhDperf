import React from 'react'
import { Form } from '@formio/react'
import { PerfWorkflowTasks } from '/imports/ui/model/perf-workflow-tasks'
import { Meteor } from 'meteor/meteor'
import { useTracker } from 'meteor/react-meteor-data'

export function Task ({workflowKey} : {workflowKey : string}) {
  useTracker(() => Meteor.subscribe('tasks'))
  const task = useTracker(() => PerfWorkflowTasks.findByKey(workflowKey))
  let formBody = <p>No form</p>
  const formIoJson = task?.customHeaders?.form_io
  if (formIoJson) {
    formBody = <Form form={ JSON.parse(formIoJson as string) } onSubmit={ onSubmit } />
  }
  return <>
    <h1>Task {workflowKey}</h1>
    {formBody}
  </>

  function onSubmit(formData : { data: any, metadata: any}) {
    Meteor.call("submit", workflowKey, formData.data, formData.metadata,
               alert)
  }
}
