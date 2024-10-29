import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {filterOutObsoleteTasksQuery, filterOutSubmittedTasksQuery} from "/imports/policy/tasks";


// TODO: set correct permissions
export const getUserPermittedTaskReminder = (user?: Meteor.User | null, _id?: string) => {
  if (!user || !_id) return

  const taskQuery = {
    _id: _id,
    ...filterOutSubmittedTasksQuery(),
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...(!user.isAdmin && { "variables.assigneeSciper": user._id }),
  }

  // Set which fields can be seen for a user, depending on their right
  // Better safe than sorry: by default remove the "not for everyone" ones
  const fieldsView: Mongo.FieldSpecifier = {
    // filter out mentor infos
    'variables.mentorSciper': 0,
    'variables.mentorName': 0,
    'variables.mentorEmail': 0,

    // and not really needed stuffs for UI
    'variables.notifyLogs': 0,
    'variables.activityLogs': 0,
    'journal': 0,
  }

  // some can see the exclusions, reactivate it
  if (user.isAdmin || user.isUberProgramAssistant) {
    delete fieldsView['variables.mentorSciper']
    delete fieldsView['variables.mentorName']
    delete fieldsView['variables.mentorEmail']
  }

  // add journals info for admin
  if (user.isAdmin) {
    delete fieldsView['journal']
  }

  return Tasks.find(taskQuery, { 'fields': fieldsView })
}

export const canSeeRemindersLogs = (user: Meteor.User) : boolean => user.isAdmin || user.isUberProgramAssistant

export const canSendReminders = async (user: Meteor.User, taskId: string) : Promise<boolean> => {
  // is the current processInstanceKey visible on the dashboard for this user ?
  const tasksSeenByUser = await getUserPermittedTaskReminder(user, taskId)?.fetchAsync() ?? []

  return !!tasksSeenByUser[0]
}
