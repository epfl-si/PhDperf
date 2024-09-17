import {Meteor} from "meteor/meteor";
import {Mongo} from 'meteor/mongo';

import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {Tasks} from "/imports/model/tasks";
import {
  filterOutObsoleteTasksQuery,
  filterOutSubmittedTasksQuery,
  getAssistantAdministrativeMemberships
} from "/imports/policy/tasks";


/**
 * Used to get the list of tasks for a specific process instance.
 * Mainly used when we want a "precise" view of the tasks and their contents.
 */
export const getUserPermittedProcessInstanceEdit = (
  user: Meteor.User | null,
  doctoralSchools: DoctoralSchool[],
  processInstanceKey: string
) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const tasksQuery = {
    processInstanceKey: processInstanceKey,
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...filterOutSubmittedTasksQuery(),
    // Get tasks for the group
    ...(!user.isAdmin && {
      "variables.doctoralProgramName": {
        $in: Object.keys(
          getAssistantAdministrativeMemberships(user, doctoralSchools)
        )
      }
    }),
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

  if (user.isAdmin || user.isUberProgramAssistant) {  // admin can see the exclusions, reactivate it
    delete fieldsView['variables.mentorSciper']
    delete fieldsView['variables.mentorName']
    delete fieldsView['variables.mentorEmail']
  }

  return Tasks.find(tasksQuery, { 'fields': fieldsView })
}

export const canEditProcessInstance = async  (
  user: Meteor.User,
  processInstanceKey: string,
): Promise<boolean> => {
  if (!user) return false;

  if (user.isAdmin || user.isUberProgramAssistant) return true;

  const allowedProcessInstancesCount = await getUserPermittedProcessInstanceEdit(
    user, DoctoralSchools.find({}).fetch(),
    processInstanceKey
  )?.countAsync()

  return allowedProcessInstancesCount ? allowedProcessInstancesCount == 0 : false
}

export const canStartProcessInstance = (user: Meteor.User, doctoralSchools: DoctoralSchool[]) : boolean => {
  if (! user) return false;

  if (user.isAdmin || user.isUberProgramAssistant) return true;

  return Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools)).length > 0
}

export const canDeleteProcessInstance = (user: Meteor.User) : boolean => {
  return !!user?.isAdmin
}

export const canRefreshProcessInstance = (user: Meteor.User) : boolean => {
  return !!user?.isAdmin
}
