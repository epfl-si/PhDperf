import dayjs from "dayjs";
import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {getAssistantAdministrativeMemberships} from "/imports/policy/tasks";


export const getTasksQueryForList = (user: Meteor.User | null) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  return {
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...(!user.isAdmin && { "variables.assigneeSciper": user._id }),
    ...filterOutSubmittedTasksQuery()
  }
}

// Define which tasks can be seen from the dashboard
export const getTasksQueryForDashboard = (
  user: Meteor.User | null,
  doctoralSchools : DoctoralSchool[]
) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  return {
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...filterOutSubmittedTasksQuery(),
    ...(!user.isAdmin && {
      '$or': [
        {"variables.assigneeSciper": user._id},
        {"variables.phdStudentSciper": user._id},
        {"variables.programAssistantSciper": user._id},  // Get tasks that we started as programAssistant
        {"variables.doctoralProgramName": {
          $in: Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools))}
        },  // Get tasks for the group
      ]
    }),
  }
}

//const gonnaTask = Tasks.find(getTasksQueryForDashboard(user, doctoralSchools), { 'fields': user.isAdmin ? taskFieldsNeededForAdmin : tasksMongoFields })

/**
 * Used to get the task if the user is allowed to see/edit/proceed
 */
export const getUserPermittedTaskDetailed = (user: Meteor.User | null, _id: string) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const taskQuery = {
    _id: _id,
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...filterOutSubmittedTasksQuery(),
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
    'variables.activityLogs': 0,
    'journal':0,
  }

  if (user.isAdmin) {  // admin can see the exclusions, reactivate it
    delete fieldsView['variables.mentorSciper']
    delete fieldsView['variables.mentorName']
    delete fieldsView['variables.mentorEmail']
    delete fieldsView['journal']
  }

  return Tasks.find(taskQuery, { 'fields': fieldsView })
}

/**
 * Build the filter query on the tasks taht last seen on zeebe is too old
 * This kind of "desync" can happen, yeah, it has already happened  because some OOM error
 */
export const filterOutObsoleteTasksQuery = () => {
  const today = dayjs()
  const yesterday = today.subtract(1, 'day')

  return {
    "journal.lastSeen": { $gte: yesterday.toDate() },
  }
}

/**
 * Filter the already submitted that we keep as rule to not reload,
 * if a task is coming from Zeebe while being submitted
 */
export const filterOutSubmittedTasksQuery = () => {
  return {
    'journal.submittedAt': { $exists:false },
  }
}
