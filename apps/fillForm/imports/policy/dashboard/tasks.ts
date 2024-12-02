import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {Meteor} from "meteor/meteor";
import {Task, Tasks} from "/imports/model/tasks";
import {
  filterOutObsoleteTasksQuery,
  filterOutSubmittedTasksQuery,
  getAssistantAdministrativeMemberships
} from "/imports/policy/tasks";
import {taskFieldsNeededForDashboard} from "/imports/policy/dashboard/type";


// Define which tasks can be seen from the dashboard
// All participants should be able to see the task, but not all data are viewable
export const getUserPermittedTasksForDashboard = (
  user: Meteor.User | null,
  doctoralSchools : DoctoralSchool[],
  fields: any = taskFieldsNeededForDashboard
) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const taskQuery = {
    ...{"variables.uuid": { $exists: true }},
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...filterOutSubmittedTasksQuery(),
    ...(!user.isAdmin && {
      '$or': [
        {"variables.assigneeSciper": user._id},
        {"variables.phdStudentSciper": user._id},
        {"variables.thesisDirectorSciper": user._id},
        {"variables.thesisCoDirectorSciper": user._id},
        {"variables.programDirectorSciper": user._id},
        {"variables.programAssistantSciper": user._id},
        {"variables.mentorSciper": user._id},
        {"variables.doctoralProgramName": {$in: Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools))}},  // Get tasks for the group
      ]
    }),
  }

  return Tasks.find(taskQuery, { 'fields': fields })
}

// Define which tasks can be seen from the dashboard, but only for oldies this time
// At a certain point (when there is no more tasks in this), this should be removable
export const getUserPermittedTasksForDashboardOld = (
  user: Meteor.User | null,
  doctoralSchools : DoctoralSchool[]
) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const taskQuery = {
    ...{"variables.uuid": { $exists: false }},
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...filterOutSubmittedTasksQuery(),
    ...(!user.isAdmin && {
      '$or': [
        {"variables.assigneeSciper": user._id},
        {"variables.phdStudentSciper": user._id},
        {"variables.thesisDirectorSciper": user._id},
        {"variables.thesisCoDirectorSciper": user._id},
        {"variables.programDirectorSciper": user._id},
        {"variables.programAssistantSciper": user._id},
        {"variables.mentorSciper": user._id},
        {"variables.doctoralProgramName": {$in: Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools))}},  // Get tasks for the group
      ]
    }),
  }

  return Tasks.find(taskQuery, { 'fields': taskFieldsNeededForDashboard })
}

/**
 * Define rule about the mentor visibility
 * In simple words, thesis co-dir and thesis dir are not allowed to see
 */
export const canViewMentor = (
  user: Meteor.User | null,
  task: Partial<Task>
) => {

  if (!user) return false;

  if (user.isAdmin) return true;

  // As soon as the user is one of this role, deny it
  if ([
    task.variables?.thesisDirectorSciper,
    task.variables?.thesisCoDirectorSciper,
    ].includes(user._id)) return false

  // only this list of role can view it
  return [
    task.variables?.phdStudentSciper,
    task.variables?.programDirectorSciper,
    task.variables?.programAssistantSciper,
    task.variables?.mentorSciper,
  ].includes(user._id)
}
