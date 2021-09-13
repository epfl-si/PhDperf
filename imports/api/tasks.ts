import {ParticipantIDs, TaskData, TasksCollection} from "/imports/model/tasks"
import {ParticipantsInfo} from "/imports/ui/components/Participant"
import {Meteor} from "meteor/meteor";

// add some useful thing for the frontend
export type Task = TaskData & {
  uri: string
  participants?: ParticipantsInfo[]
  detail: any
  monitorUri: string | undefined  // not for prod
  created_at?: Date
  updated_at?: Date
}

const Tasks_ = TasksCollection<Task>((data) => {
  const task = data as Task

  if (task.variables.created_at) task.created_at = new Date(task.variables.created_at)
  if (task.variables.updated_at) task.updated_at = new Date(task.variables.updated_at)

  // yep, participants are tricky, as we can not save a structured dict into Zeebe,
  // we fetch them from well known values, divided in ..Sciper and ..Info parts
  task.participants = ParticipantIDs.map(participantName => {
    if (task.variables[`${participantName}Sciper`]) {
      const participant: ParticipantsInfo = {
        sciper: task.variables[`${participantName}Sciper`],
        role: participantName
      }

      participant.isAssignee = !!(task.variables.assigneeSciper && task.variables.assigneeSciper === participant.sciper)

      if (task.variables[`${participantName}Info`]) {
        participant.info = task.variables[`${participantName}Info`]
      }

      return participant
    }
  }).filter(i => i) as ParticipantsInfo[]

  task.detail = [
    `Job key: ${task._id}`,
    `workflow version: ${task.processDefinitionVersion}`,
    `activityLogs: ${JSON.stringify(task.variables.activityLogs, null, 2)}`,
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
