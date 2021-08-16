import {ParticipantIDs, TaskData, TasksCollection} from "/imports/model/tasks"
import {ParticipantsInfo} from "/imports/ui/components/Participant"

// add some useful thing for the front
export type Task = TaskData & {
  uri: string
  participants?: ParticipantsInfo[]
  detail: any
  monitorUri: string  // not for prod
}

const Tasks_ = TasksCollection<Task>((data) => {
  const task = data as Task

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
  task.monitorUri = `http://localhost:8082/views/instances/${task.processInstanceKey}`

  return task
})

const TasksClassMethods = {
  findByKey(key: string) {
    return Tasks_.findOne({_id: key})
  }
}

export const Tasks : typeof Tasks_ & typeof TasksClassMethods =
  Object.assign(Tasks_, TasksClassMethods)
