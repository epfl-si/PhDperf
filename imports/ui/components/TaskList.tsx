import { Meteor } from "meteor/meteor"
import React from "react"
import { useTracker } from 'meteor/react-meteor-data'
import { WorkflowTasks } from '/imports/api/workflow-tasks'

export function TaskList() {
  useTracker(() => Meteor.subscribe('tasks'))
  const tasks = useTracker(() => WorkflowTasks.find({}).fetch())

  return <ul>
    {tasks.map(task => <li><pre>{JSON.stringify(task, null, "  ")}</pre></li>)}
  </ul>
}
