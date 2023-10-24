import React from "react";
import {useParams} from "react-router-dom";
import {useSubscribe, useFind} from "meteor/react-meteor-data";
import {Loader} from "@epfl/epfl-sti-react-library";

import {useAccountContext} from "/imports/ui/contexts/Account";
import {Task, Tasks} from "/imports/model/tasks";
import {EditParticipants, Participant} from "/imports/ui/components/Participant";
import {TaskInfo} from "/imports/ui/components/Task/Info";
import {ITaskList} from "/imports/policy/tasksList/type";
import {canEditParticipants} from "/imports/policy/tasks";


const ListTasks = ({ tasks }: { tasks : Task[] }) => {
  return <div className={'mb-5'}>
    {
      tasks.map( (task) => {
        return (<>

          <div className="border-top pt-3">
            <div className={''}>Task { task._id }</div>
            <div className={'font-weight-bold'}>{ task.customHeaders.title }</div>
            <TaskInfo task={ task as ITaskList } showPhDStudent={ false }/>
          </div>
          <div className="row mb-3">
            { task!.participants &&
              Object.entries(task!.participants).map(([role, info]) =>
                <Participant
                  key={ `${task!._id}-${role}` }
                  role={ role }
                  info={ info }
                  isAssignee={ task!.assigneeScipers?.includes(info?.sciper) }
                  showEmail={ true }
                />
              )
            }
          </div>
          </>
        )
      })
    }
  </div>
}

export const Show = () => {
  const account = useAccountContext()

  const { processInstanceKey } = useParams<{ processInstanceKey: string }>()
  const isTasksLoading = useSubscribe('tasksList', processInstanceKey);
  const tasks = useFind(() => Tasks.find(
    { 'processInstanceKey': processInstanceKey}), [processInstanceKey]
  )

  if (!account?.user) return <Loader message={ 'Loading your data...' }/>

  if (!canEditParticipants(account.user)) return <div>{ 'Sorry, you do not have the permission to edit participants' }</div>

  if (!processInstanceKey) return <Loader message={ 'Loading the process...' }/>

  if (isTasksLoading()) return <Loader message={ 'Loading the tasks...' }/>

  if (!tasks) return <div>No task(s) for workflow with the process instance key: { processInstanceKey }</div>

  return <div>
    <div className={ 'h4' }>Process instance {processInstanceKey}</div>
    { tasks[0].processInstanceKey ?
        <EditParticipants processInstanceKey={ processInstanceKey! } /> :
        <div>No process instance key found on the first task. It is a requirment to edit the participants</div>
    }
    <div className={ 'mt-3' }>
      <ListTasks tasks={ tasks }/>
    </div>
  </div>
}

export default Show
