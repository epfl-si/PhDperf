import {Meteor} from "meteor/meteor";
import {Mongo} from 'meteor/mongo';

import {Tasks} from "/imports/model/tasks";
import {
  filterOutObsoleteTasksQuery,
  filterOutSubmittedTasksQuery,
  getAssistantAdministrativeMemberships
} from "/imports/policy/tasks";
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";


/**
 * Used to get the list of tasks for a specific process instance.
 * Mainly used when we want a "precise" view of the tasks and their contents.
 */
export const getUserPermittedProcessInstanceEdit = (
  user: Meteor.User | null,
  processInstanceKey: string
) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const tasksQuery = {
    processInstanceKey: processInstanceKey,
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...filterOutSubmittedTasksQuery(),
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
  }

  return Tasks.find(tasksQuery, { 'fields': fieldsView })
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

export const canEditProcessInstanceVariables = (user: Meteor.User) : boolean => {
  return !!user?.isAdmin
}

export const canEditParticipants = (user: Meteor.User) : boolean => {
  return !!user?.isAdmin
}
