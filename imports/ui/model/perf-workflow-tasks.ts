import _ from "lodash"
import {  FillFormTaskData, fillFormTasksCollection } from "/imports/api/perf-workflow-tasks"

export type PerfWorkflowTask = FillFormTaskData & {
  title: string
  assignee: string
  uri: string
  detail: any
  monitorUri: string  // not for prod
}

const PerfWorkflowTasks_ = fillFormTasksCollection<PerfWorkflowTask>((data) => {
  const task = data as PerfWorkflowTask
  task.title = data.customHeaders?.title
  task.assignee = data.variables?.assigneeSciper
  task.uri = `/tasks/${data.key}`
  task.detail = `Job key: ${data.key}, workflow version: ${data.processDefinitionVersion}, variables: ${JSON.stringify(_.omit(data.variables, 'metadata'), null, 2)}`
  task.monitorUri = `http://localhost:8082/views/instances/${data.processInstanceKey}`
  return task
})

const PerfWorkflowTasksClassMethods = {
  findByKey(key : string) {
    return PerfWorkflowTasks_.findOne({key})
  }
}

export const PerfWorkflowTasks : typeof PerfWorkflowTasks_ & typeof PerfWorkflowTasksClassMethods =
  Object.assign(PerfWorkflowTasks_, PerfWorkflowTasksClassMethods)
