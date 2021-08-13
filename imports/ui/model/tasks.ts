import {TasksCollection} from "../../api/tasks"
import {Sciper} from "/imports/api/datatypes";

export interface FormioActivityLog {
  timezone?: string;
  offset?: number;
  origin?: string;
  referrer?: string;
  browserName?: string;
  userAgent?: string;
  pathName?: string;
  onLine?: boolean;
}

export interface TaskParticipant {
  sciper: Sciper
  displayName?: string
  role: string
  isAssignee: boolean
}

export type TaskData = {
  _id: string
  created_by?: Sciper
  created_at?: Date
  updated_at?: Date
  lastSeen?: Date
  title?: string
  participants?: TaskParticipant[]
  formIO: string
  zeebeInfo: any
  variables?: any
  activityLogs?: FormioActivityLog[]
}

// add some useful thing for frontend
export type Task = TaskData & {
  uri: string
  detail: any
  monitorUri: string  // not for prod
}

const Tasks_ = TasksCollection<Task>((data) => {
  const task = data as Task
  task.detail = [
    `Job key: ${data._id}`,
    `workflow version: ${data.zeebeInfo.processDefinitionVersion}`,
    `zeebeInfo: ${JSON.stringify(data.zeebeInfo, null, 2)}`,
    `activityLogs: ${JSON.stringify(data.activityLogs, null, 2)}`,
    ].join(", ")
  task.monitorUri = `http://localhost:8082/views/instances/${data.zeebeInfo.processInstanceKey}`
  return task
})

const TasksClassMethods = {
  findByKey(key: string) {
    return Tasks_.findOne({_id: key})
  }
}

export const Tasks : typeof Tasks_ & typeof TasksClassMethods =
  Object.assign(Tasks_, TasksClassMethods)
