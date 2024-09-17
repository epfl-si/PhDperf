import React from "react";
import {useParams} from "react-router-dom";
import {useSubscribe, useFind} from "meteor/react-meteor-data";
import {Loader} from "@epfl/epfl-sti-react-library";

import {useAccountContext} from "/imports/ui/contexts/Account";

import {Tasks} from "/imports/model/tasks";

import {Tab, Tabs} from "react-bootstrap";
import {ListTasks} from "/imports/ui/components/ProcessInstance/ListTasks";
import {EditVariables} from "/imports/ui/components/ProcessInstance/UpdateVariables";
import {EditParticipants} from "/imports/ui/components/ProcessInstance/EditParticipants";


export const Show = () => {
  const account = useAccountContext()

  const { processInstanceKey } = useParams<{ processInstanceKey: string }>()
  const isTasksLoading = useSubscribe('processInstanceEdit', processInstanceKey);
  const tasks = useFind(() => Tasks.find(
    { 'processInstanceKey': processInstanceKey}), [processInstanceKey]
  )

  if (!account?.user) return <Loader message={ 'Loading your data...' }/>

  if (!processInstanceKey) return <Loader message={ 'Loading the process...' }/>

  if (isTasksLoading()) return <Loader message={ 'Loading the tasks...' }/>

  if (!tasks || tasks.length == 0)
    return <div>{ 'Sorry, there is no process instance with this key or you do not have the permission to edit this process instance' }</div>

  return <>
    <div className={ 'h4 mt-2 mb-3' }>Edit process instance { processInstanceKey }</div>
    <Tabs>
      <Tab key='listJobs' eventKey='listJobs' title='Ongoing tasks'>
        <ListTasks tasks={ tasks }/>
      </Tab>
      <Tab key='editParticipants' eventKey='editParticipants' title='Change participants'>
        <div className={ 'mt-3' }>
          <EditParticipants tasks={ tasks }/>
        </div>
      </Tab>
      <Tab key='editVariables'  eventKey='editVariables' title='Due date'>
        <div className={ 'mt-3' }>
          <EditVariables task={ tasks[0] }/>
        </div>
      </Tab>
    </Tabs>
  </>
}

export default Show
