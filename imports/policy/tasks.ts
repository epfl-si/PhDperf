import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {findFieldKeysToSubmit} from "/imports/lib/formIOUtils"
import _ from "lodash";
import { Mongo } from 'meteor/mongo';
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
const debug = require('debug')('import/policy/tasks.ts')


// set which fields can be seen for a user, depending of their rights
const getDefaultTaskFields = (user: Meteor.User) => {

  // better safe than sorry, by default remove the "not for everyone" ones
  const fieldsView: Mongo.FieldSpecifier = {
    // filter out mentor infos
    'variables.mentorSciper': 0,
    'variables.mentorName': 0,
    'variables.mentorEmail': 0,

    // and admin stuffs
    'variables.activityLogs': 0,

    // not used fields can be removed too, for saving some bandwidth
    //'variables.bpmnProcessId':0,
    // ...
  }

  if (user.isAdmin) {  // remove some exclusions, if admin
    delete fieldsView['variables.mentorSciper']
    delete fieldsView['variables.mentorName']
    delete fieldsView['variables.mentorEmail']
  }

  return fieldsView
}

/**
 * Used to get the task if the user is allowed to see/edit/proceed
 */
export const getUserPermittedTaskDetailed = (_id: String) => {

  const getTaskQuery = (_id: String, user: Meteor.User) => {
    let taskQuery: any = { _id: _id }

    if (user.isAdmin) {
      return taskQuery
    } else {
      taskQuery["variables.assigneeSciper"] = user._id
      return taskQuery
    }
  }

  const user = Meteor.user()

  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const fieldsView = getDefaultTaskFields(user)
  const taskQuery = getTaskQuery(_id, user)  // get only the task needed

  return Tasks.find(taskQuery, { 'fields': fieldsView })
}

// Define which tasks can be seen from the task list
export const getUserPermittedTasksForList = () => {
  const getTasksQuery = (user: Meteor.User) => {
    if (user.isAdmin) {
      return {}
    } else {
      return {"variables.assigneeSciper": user._id }
    }
  }

  const user = Meteor.user()

  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return
  const fieldsView = getDefaultTaskFields(user)
  const taskQuery = getTasksQuery(user)

  fieldsView['customHeaders.formIO'] = 0  // always exclude the formIO data from tasks list

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

// Define which tasks can be seen from the dashboard
export const getUserPermittedTasksForDashboard = (doctoralSchools : DoctoralSchool[]) => {

  const getTasksQueryForDashboard = (user: Meteor.User) => {

    if (user.isAdmin) {
      return {}  // get all if admin
    } else {
      return {
        '$or' : [
          { "variables.programAssistantSciper": Meteor.user()?._id },  // Get tasks that we started as programAssistant
          { "variables.assigneeSciper": Meteor.user()?._id },  // Get assigned tasks
          { "variables.doctoralProgramName": { $in: Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools)) } }  // Get tasks for the group
        ]
      }
    }
  }

  const user = Meteor.user()

  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return
  const fieldsView = getDefaultTaskFields(user)
  const taskQuery = getTasksQueryForDashboard(user)  //get only the task needed

  // remove unused "too big" fields from the dashboard
  fieldsView['customHeaders.formIO'] = 0

  return Tasks.find(taskQuery, { 'fields': fieldsView })
}

export const canSubmit = (taskId: string) : boolean => {
  const user = Meteor.user()

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

export const canStartProcessInstance = (doctoralSchools: DoctoralSchool[]) : boolean => {
  const user = Meteor.user();
  if (! user) return false;
  if (user.isAdmin || user.isUberProgramAssistant) return true;
  return Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools)).length > 0
}

export const canDeleteProcessInstance = () : boolean => {
  return !!Meteor.user()?.isAdmin
}

export const canRefreshProcessInstance = () : boolean => {
  return !!Meteor.user()?.isAdmin
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
