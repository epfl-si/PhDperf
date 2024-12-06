import {Task} from "/imports/model/tasks";
import {ReminderLog, ReminderLogs} from "/imports/api/reminderLogs/schema";


export const onZeebeReminderCreated = async (
  task: Task
) => {
  const processInstance = ReminderLogs.findOne(
    { _id: task.processInstanceKey }
  )

  const log: ReminderLog = {
    elementId: task.elementId,
    datetime: new Date().toJSON(),
  }

  if ( processInstance ) {
    await ReminderLogs.updateAsync(
      { _id: task.processInstanceKey },
      { $push: {
          'logs': log
        }})
  } else {
    await ReminderLogs.insertAsync({
      '_id': task.processInstanceKey,
      'logs': [log],
    })
  }
}
