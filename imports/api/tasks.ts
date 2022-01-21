import {TaskData, TasksCollection} from "/imports/model/tasks"
import {Meteor} from "meteor/meteor";
import {ParticipantList, participantsFromZeebe} from "/imports/model/participants";
import {Sciper} from "/imports/api/datatypes";

// add some useful thing for the frontend
export type Task = TaskData & {
  uri: string
  participants?: ParticipantList
  detail: any
  monitorUri: string | undefined  // not for prod
  created_by?: Sciper
  created_at?: Date
  updated_at?: Date
}

const Tasks_ = TasksCollection<Task>((data) => {
  const task = data as Task

  if (task.variables) {
    if (task.variables.created_by) task.created_by = task.variables.created_by
    if (task.variables.created_at) task.created_at = new Date(task.variables.created_at)
    if (task.variables.updated_at) task.updated_at = new Date(task.variables.updated_at)
  }

  task.participants = participantsFromZeebe(task.variables)

  task.detail = [
    `Job key: ${task._id}`,
    `Process instance key: ${task.processInstanceKey}`,
    `workflow version: ${task.processDefinitionVersion}`,
  ].join(", ")

  task.monitorUri = Meteor.settings.public.monitor_address && Meteor.user()?.isAdmin ?
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
