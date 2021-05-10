import _ from "lodash"
import {  FillFormTaskData, fillFormTasksCollection } from "/imports/api/perf-workflow-tasks"

export type PerfWorkflowTask = FillFormTaskData & {
  getUri : () => string
  getName : () => string
  getDetail: () => any
  getOperateUri : () => string  // not for prod
}

const PerfWorkflowTasks_ = fillFormTasksCollection<PerfWorkflowTask>((data) => {
  const task = data as PerfWorkflowTask
  const zeebeAddress = `be0628da-ddd4-4cfc-82ca-5c66504c7ef6` // should be process.env.ZEEBE_ADDRESS truncated but not in "no server parts"
  task.getUri = () => `/tasks/${data.key}`
  task.getName = () => `${data.customHeaders.title} (${data.key})`
  task.getDetail = () => ` version: ${data.workflowDefinitionVersion}, variables: ${JSON.stringify(_.omit(data.variables, 'metadata'), null, 2)}`
  task.getOperateUri = () => `https://bru-1.operate.camunda.io/${zeebeAddress}/#/instances/${data.workflowInstanceKey}`
  return task
})

const PerfWorkflowTasksClassMethods = {
  findByKey(key : string) {
    return PerfWorkflowTasks_.findOne({key})
  }
}

export const PerfWorkflowTasks : typeof PerfWorkflowTasks_ & typeof PerfWorkflowTasksClassMethods =
  Object.assign(PerfWorkflowTasks_, PerfWorkflowTasksClassMethods)
