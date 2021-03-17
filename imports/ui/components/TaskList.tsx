import { Meteor } from "meteor/meteor"
import React from "react"
import { useTracker } from 'meteor/react-meteor-data'
import { PerfWorkflowTasks } from '/imports/api/perf-workflow-tasks'

export function TaskList() {
  useTracker(() => Meteor.subscribe('tasks'))
  const tasks = useTracker(() => PerfWorkflowTasks.find({}).fetch())

  return <ul>
    {tasks.map(task => <li key={task.key}><pre>{JSON.stringify(task, null, "  ")}</pre></li>)}
  </ul>
}
