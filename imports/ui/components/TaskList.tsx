import { Meteor } from "meteor/meteor"
import React from "react"
import { useTracker } from 'meteor/react-meteor-data'
import { PerfWorkflowTask, PerfWorkflowTasks } from '/imports/ui/model/perf-workflow-tasks'
import { Link } from "react-router-dom"

export function TaskList() {
  useTracker(() => Meteor.subscribe('tasks'))
  const tasks = useTracker(() => PerfWorkflowTasks.find({}).fetch())

  return <ul>
    {tasks.map((task : PerfWorkflowTask) => <li key={task.key}><Link to={task.getUri()}>{task.getName()}</Link></li>)}
  </ul>
}
