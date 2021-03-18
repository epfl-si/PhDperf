import {  PerfWorkflowTaskData, perfWorkflowTasksCollection } from "/imports/api/perf-workflow-tasks"

export type PerfWorkflowTask = PerfWorkflowTaskData & {
  getUri : () => string
  getName : () => string
}

export const PerfWorkflowTasks = perfWorkflowTasksCollection<PerfWorkflowTask>((data) => {
  const task = data as PerfWorkflowTask
  task.getUri = () => `/tasks/${data.key}`
  task.getName = () => JSON.stringify(data.variables)
  return task
})
