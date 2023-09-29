import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import _ from "lodash";
import { Mongo } from 'meteor/mongo';
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import dayjs from "dayjs";
const debug = require('debug')('import/policy/tasks.ts')


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

export const canEditParticipants = (user: Meteor.User) : boolean => {
  return !!user?.isAdmin
}

/*
 * Get keys that are submittable. (aka not disabled)
 */
export function findFieldKeysToSubmit(form: any) {
  let fieldKeys: string[] = [];

  const rootComponents = form.components;

  const searchForFieldKeys = (components: []) => {
    components.forEach((element: any) => {
      if (element.key !== undefined &&
        !element.disabled &&
        element.type !== 'panel') {
        fieldKeys.push(element.key);
      }

      if (element.components !== undefined) {
        searchForFieldKeys(element.components);
      }
    })
  };

  searchForFieldKeys(rootComponents);

  return fieldKeys;
}

/*
 * Limit what can be submitted per step, by reading the provided formIO
 * @param dataToSubmit The raw data coming from the UI
 * @param formIODefinition The formIO for the current task
 * @param additionalIgnores Add key list of data you don't want to submit
 * @param exceptions The ones you whitelist anyway
 * @return the cleanuped data ready to be submitted
 */
export const filterUnsubmittableVars = (dataToSubmit: any, formIODefinition: any, additionalIgnores: string[], exceptions: string[]) => {
  let allowedKeys = findFieldKeysToSubmit(JSON.parse(formIODefinition))
  allowedKeys = allowedKeys.filter(n => !additionalIgnores.includes(n))
  allowedKeys = [...new Set([...allowedKeys ,...exceptions])]

  const dataAllowedToSubmit = _.pick(dataToSubmit, allowedKeys)
  const diff = _.differenceWith(Object.keys(dataToSubmit), allowedKeys, _.isEqual)
  if (diff) {
    debug(`Removed this keys has they are unauthorized to be sent: ${diff}`)
  }

  return dataAllowedToSubmit
}
