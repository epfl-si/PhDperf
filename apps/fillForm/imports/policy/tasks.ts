import {Meteor} from "meteor/meteor";
import {Mongo} from 'meteor/mongo';

import dayjs from "dayjs";

import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {Tasks} from "/imports/model/tasks";


/**
 * Build the filter query on the tasks that last seen on zeebe is too old
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
 * Returns a dict, keyed by doctoral school acronym, of all `doctoralSchools` this `user` is an administrative assistant for.
 *
 * @param user A Meteor.User instance
 * @param doctoralSchools A list of DoctoralSchool instances (either all of them, or only one of them to check rights on just that school)
 */
export const getAssistantAdministrativeMemberships = (user: Meteor.User, doctoralSchools: DoctoralSchool[]) => {
  const schools : { [acronym : string ] : DoctoralSchool } = {};
  user.groupList.forEach((groupName) => {
    const moreSchools = doctoralSchools.filter((ds) => ds.administrativeAssistantAccessGroup === groupName);
    moreSchools.forEach((ds) => { schools[ds.acronym] = ds });
  });

  return schools;
}

export const canSubmit = (user: Meteor.User | null, taskId: string) : boolean => {
  if (!user) return false

  if (user.isAdmin) {
    return true
  } else {
    const groups = user.groupList

    if (groups && groups.length > 0) {
      return Tasks.find({
        $and: [
          { "_id": taskId },
          { $or: [
              { "customHeaders.allowedGroups": {$in: user.groupList} },
              { "variables.assigneeSciper": user._id }
            ]
          }
        ]
      }).count() > 0
    } else {
      return Tasks.find({
        $and: [
          { "_id": taskId },
          { "variables.assigneeSciper": user._id }
        ]
      }).count() > 0
    }
  }
}

