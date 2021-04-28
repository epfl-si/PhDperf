import {  PerfWorkflowTaskData, perfWorkflowTasksCollection } from "/imports/api/perf-workflow-tasks"

export type PerfWorkflowTask = PerfWorkflowTaskData & {
  getUri : () => string
  getName : () => string
  getDetail: () => string
  getOperateUri : () => string  // not for prod
}

const PerfWorkflowTasks_ = perfWorkflowTasksCollection<PerfWorkflowTask>((data) => {
  const task = data as PerfWorkflowTask
  const zeebeAddress = `be0628da-ddd4-4cfc-82ca-5c66504c7ef6` // should be process.env.ZEEBE_ADDRESS truncated but not in "no server parts"
  task.getUri = () => `/tasks/${data.key}`
  task.getName = () => `${data.elementId}`
  task.getDetail = () => `${Object.keys(data.variables).length} variable(s) : ${Object.keys(data.variables)}`
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
