import {Task} from "/imports/model/tasks";
import {TaskInfo} from "/imports/ui/components/Task/Info";
import {ITaskList} from "/imports/policy/tasksList/type";
import {ParticipantsAsRow} from "/imports/ui/components/Participant/List";
import React from "react";

export const ListTasks = ({ tasks }: { tasks : Task[] }) => {
  return <div className={'mb-5'}>
    { tasks.map( task => <div key={ task.key }>
        <div className="border-top pt-3">
          <div className={''}>Task { task._id }</div>
          <div className={'font-weight-bold'}>{ task.customHeaders.title }</div>
          <TaskInfo task={ task as ITaskList } showPhDStudent={ false }/>
        </div>
        <div className="mb-3">
          <ParticipantsAsRow
            task={ task }
            showEmail={ true }
          />
        </div>
        <hr />
      </div>
    )}
  </div>
}
