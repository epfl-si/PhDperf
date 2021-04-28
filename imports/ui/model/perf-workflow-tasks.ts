import {  PerfWorkflowTaskData, perfWorkflowTasksCollection } from "/imports/api/perf-workflow-tasks"

export type PerfWorkflowTask = PerfWorkflowTaskData & {
  getUri : () => string
  getName : () => string
}

const PerfWorkflowTasks_ = perfWorkflowTasksCollection<PerfWorkflowTask>((data) => {
  const task = data as PerfWorkflowTask
  task.getUri = () => `/tasks/${data.key}`
  task.getName = () => `Start step 1 task #${data.key} (`  + JSON.stringify(data.variables) + `)`
  return task
})

const PerfWorkflowTasksClassMethods = {
  findByKey(key : string) {
    return PerfWorkflowTasks_.findOne({key})
  }
}

export const PerfWorkflowTasks : typeof PerfWorkflowTasks_ & typeof PerfWorkflowTasksClassMethods =
  Object.assign(PerfWorkflowTasks_, PerfWorkflowTasksClassMethods)
