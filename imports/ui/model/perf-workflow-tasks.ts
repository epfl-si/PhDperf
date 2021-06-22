import _ from "lodash"
import {  FillFormTaskData, fillFormTasksCollection } from "/imports/api/perf-workflow-tasks"

export type PerfWorkflowTask = FillFormTaskData & {
  getUri : () => string
  getName : () => string
  getDetail: () => any
  getMonitorUri : () => string  // not for prod
}

const PerfWorkflowTasks_ = fillFormTasksCollection<PerfWorkflowTask>((data) => {
  const task = data as PerfWorkflowTask
  task.getUri = () => `/tasks/${data.key}`
  task.getName = () => `${data.customHeaders.title} (${data.key})`
  task.getDetail = () => `workflow version: ${data.processDefinitionVersion}, variables: ${JSON.stringify(_.omit(data.variables, 'metadata'), null, 2)}`
  task.getMonitorUri = () => `http://localhost:8082/views/instances/${data.processInstanceKey}`
  return task
})

const PerfWorkflowTasksClassMethods = {
  findByKey(key : string) {
    return PerfWorkflowTasks_.findOne({key})
  }
}

export const PerfWorkflowTasks : typeof PerfWorkflowTasks_ & typeof PerfWorkflowTasksClassMethods =
  Object.assign(PerfWorkflowTasks_, PerfWorkflowTasksClassMethods)
