import {TaskData, TasksCollection} from "/imports/model/tasks"
import {Meteor} from "meteor/meteor";
import {ParticipantList, participantsFromZeebe} from "/imports/model/participants";

// add some useful thing for the frontend
export type Task = TaskData & {
  uri: string
  participants?: ParticipantList
  detail: any
  monitorUri: string | undefined  // not for prod
  created_at?: Date
  updated_at?: Date
}

const Tasks_ = TasksCollection<Task>((data) => {
  const task = data as Task

  if (task.variables) {
    if (task.variables.created_at) task.created_at = new Date(task.variables.created_at)
    if (task.variables.updated_at) task.updated_at = new Date(task.variables.updated_at)
  }

  task.participants = participantsFromZeebe(task.variables)

  task.detail = [
    `Job key: ${task._id}`,
    `Process instance key: ${task.processInstanceKey}`,
    `workflow version: ${task.processDefinitionVersion}`,
    `activityLogs: ${JSON.stringify(task.variables?.activityLogs, null, 2)}`,
    `participants: ${JSON.stringify(task.participants)}`,
  ].join(", ")

  task.monitorUri = Meteor.user()?.isAdmin && Meteor.settings.public.monitor_address ?
    `http://${Meteor.settings.public.monitor_address}/views/instances/${task.processInstanceKey}` :
    undefined

  return task
})

const TasksClassMethods = {
  findByKey(key: string) {
    return Tasks_.findOne({_id: key})
  }
}

export const Tasks : typeof Tasks_ & typeof TasksClassMethods =
  Object.assign(Tasks_, TasksClassMethods)
