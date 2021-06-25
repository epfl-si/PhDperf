import React from 'react'
import {Form, Errors} from '@formio/react'
import {customEvent} from '/imports/ui/model/formIo'
import {PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
import {Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {Button, Loader, Alert} from "epfl-sti-react-library"
import {Link} from "react-router-dom";
import _ from "lodash";

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
        <Loader message={'Fetching task...'}/>
      </>) : (<>
        <h1 className={'h2'}>{task?.getName() || `Task ${workflowKey}`}</h1>
        <Errors/>
        {formIoJson ? (
          <Form form={JSON.parse(formIoJson as string)}
                submission={ { data: task?.variables }}
                noDefaultSubmitButton={true}
                onSubmit={onSubmit}
                onCustomEvent={(event: customEvent) => event.type == 'cancelClicked' && window.history.go(-1)}
          />) : (<>
          <Alert message={'Form submitted'} alertType={'success'}/>
          <Link to={`/`}><Button label={'Back'} onClickFn={() => void 0}/></Link>
        </>)}
      </>)}
    </>)

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
