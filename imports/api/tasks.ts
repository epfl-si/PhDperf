import {TaskData, TasksCollection} from "/imports/model/tasks";

// add some useful thing for the front
export type Task = TaskData & {
  uri: string
  detail: any
  monitorUri: string  // not for prod
}

const Tasks_ = TasksCollection<Task>((data) => {
  const task = data as Task
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
