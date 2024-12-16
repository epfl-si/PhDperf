import {ActivityLog, ActivityLogs} from "/imports/api/activityLogs/schema";
import {PhDZeebeJob} from "/server/zeebe/in";
import {Task} from "/imports/model/tasks";


export const bumpActivityLogsOnTaskNewArrival = (
  job: PhDZeebeJob
)=>  {

  const processInstance = ActivityLogs.findOne(
    { _id: job.processInstanceKey }
  )

  const isEventAlreadySet = processInstance?.logs?.filter(
    log => log.elementId === job.elementId && log.event === 'started'
  )
  if ( isEventAlreadySet && isEventAlreadySet.length > 0 ) return

  const log : ActivityLog = {
    jobKey: job.key,
    elementId: job.elementId,
    event: 'started',
    datetime: new Date().toJSON(),
  }

  if ( processInstance ) {
    ActivityLogs.update(
      { _id: job.processInstanceKey },
      { $push: {
          'logs': log
        }})
  } else {
    ActivityLogs.insert({
      '_id': job.processInstanceKey,
      'logs': [log],
      })
  }
}

export const bumpActivityLogsOnTaskSubmit = (
  task: Task
)=>  {
  const processInstance = ActivityLogs.findOne(
    { _id: task.processInstanceKey }
  )

  const log : ActivityLog = {
    jobKey: task.key,
    elementId: task.elementId,
    event: 'completed',
    datetime: new Date().toJSON(),
  }

  if ( processInstance ) {
    ActivityLogs.update(
      { _id: task.processInstanceKey },
      { $push: {
          'logs': log
        }})
  } else {
    ActivityLogs.insert({
      '_id': task.processInstanceKey,
      'logs': [log],
    })
  }
}
