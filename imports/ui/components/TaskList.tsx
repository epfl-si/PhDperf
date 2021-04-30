import {Meteor} from "meteor/meteor"
import React from "react"
import {useTracker} from 'meteor/react-meteor-data'
import {PerfWorkflowTask, PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
import {Button} from "epfl-sti-react-library"


export default function TaskList() {
  useTracker(() => Meteor.subscribe('tasks'))

  const tasks = useTracker(() => PerfWorkflowTasks.find({}).fetch())

  return (
    <>
      <h3>Need input forms</h3>
      <ul>
        {tasks.map(
          (task: PerfWorkflowTask) =>
            <li key={task.key}>
              {task.getName()} <Button label={'Proceed'} onClickFn={() => window.open(task.getUri())}/>
              <ul>
                <li><a href={task.getOperateUri()} target="_blank">See on Operate</a></li>
                <li><a onClick={() => console.log(task.getDetail())} href={'#'}>Console.log Details</a></li>
              </ul>
            </li>
        )}
      </ul>
    </>
  )
}
