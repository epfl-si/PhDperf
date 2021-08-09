import _ from "lodash"
import {TaskData, TasksCollection} from "/imports/api/perf-workflow-tasks"
import {Sciper} from "/imports/api/datatypes";

export interface TaskParticipant {
  sciper: Sciper
  displayName: string
  role: string
  isAssignee: boolean
}

export type Task = TaskData & {
  title: string
  participants: TaskParticipant[]
  uri: string
  detail: any
  monitorUri: string  // not for prod
}

const Tasks_ = TasksCollection<Task>((data) => {
  const task = data as Task

  task.created_by = data.variables.created_by
  task.created_at = new Date(data.variables.created_at)
  task.updated_at = new Date(data.variables.updated_at)

  task.title = data.customHeaders?.title || data.elementId || "Unknown"
  task.participants = []

  // get participants
  // TODO: get all participants, this a proto on how to do it
  /*
  import {MyInputVariables, TaskData, TasksCollection, WorkerInputVariables} from "/imports/api/perf-workflow-tasks"
  const keysOfProps = Object.keys(new MyInputVariables()) as WorkerInputVariables;
  keysOfProps.forEach((key: string | number) => {
    if (key in data.variables) {
      task.participants.push(data.variables[key])
    }
  })*/
  if (data.variables.phdStudentSciper) {
    const isAssignee = data.variables.assigneeSciper === data.variables.phdStudentSciper
    task.participants.push({
      sciper: data.variables.phdStudentSciper,
      displayName: 'No name at the moment',
      role: 'phdStudent',
      isAssignee: isAssignee,
    })
  }

  task.uri = `/tasks/${data.key}`
  task.detail = `Job key: ${data.key}, workflow version: ${data.processDefinitionVersion}, variables: ${JSON.stringify(_.omit(data.variables, 'metadata'), null, 2)}`
  task.monitorUri = `http://localhost:8082/views/instances/${data.processInstanceKey}`
  return task
})

const TasksClassMethods = {
  findByKey(key : string) {
    return Tasks_.findOne({key})
  }
}

export const PerfWorkflowTasks : typeof Tasks_ & typeof TasksClassMethods =
  Object.assign(Tasks_, TasksClassMethods)
