import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {findFieldKeysToSubmit} from "/imports/lib/formIOUtils"
import _ from "lodash";
import { Mongo } from 'meteor/mongo';
const debug = require('debug')('import/policy/tasks.ts')

export const canSeeMentorInfos = () : boolean => {
  return !!Meteor.user()?.isAdmin
}

// Define which tasks can be seen from the task list
export const get_user_permitted_tasks = () => {
  let taskQuery

  // by default, filter out mentor infos from client
  let taskFields: Mongo.FieldSpecifier | undefined = {
    'variables.mentorSciper': 0,
    'variables.mentorName': 0,
    'variables.mentorEmail': 0
  }

  if (Meteor.user()?.isAdmin) {
    // query all the tasks
    taskQuery = {}
  } else {
    // hide any activities log if not admin
    taskFields['variables.activityLogs'] = 0

    const groups = Meteor.user()?.groupList

    if (groups && groups.length > 0) {
      taskQuery = {
        $or: [
          { "customHeaders.allowedGroups": { $in: groups } },  // Get tasks for the group
          { "variables.assigneeSciper": Meteor.user()?._id },  // Get assigned tasks
        ]
      }
    } else {
      taskQuery = { "variables.assigneeSciper": Meteor.user()?._id }
    }
  }

  if (canSeeMentorInfos()) {
    taskFields = {}
  }

  return Tasks.find(taskQuery, { 'fields': taskFields })
}

// Define which tasks can be seen from the dashboard
export const get_user_permitted_tasks_dashboard = () => {
  let taskQuery

  // by default, filter out mentor infos from client
  let taskFields: Mongo.FieldSpecifier | undefined = {
    'variables.mentorSciper': 0,
    'variables.mentorName': 0,
    'variables.mentorEmail': 0
  }

  if (Meteor.user()?.isAdmin) {
    // query all the tasks
    taskQuery = {}
  } else if (Meteor.user()?.isProgramAssistant) {
    const groups = Meteor.user()?.groupList

    if (groups && groups.length > 0) {
      taskQuery = {
        $or: [
          { "customHeaders.allowedGroups": { $in: groups } },  // Get tasks for the group
          { "variables.programAssistantSciper": Meteor.user()?._id },  // Get assigned tasks
        ]
      }
    } else {
      taskQuery = { "variables.programAssistantSciper": Meteor.user()?._id }
    }
  } else {
    taskQuery = { "variables.phdStudentSciper": Meteor.user()?._id }
  }

  if (canSeeMentorInfos()) {
    taskFields = {}
  }

  return Tasks.find(taskQuery, { 'fields': taskFields })
}

export const canSubmit = (taskKey: string) : boolean => {
  if (Meteor.user()?.isAdmin) {
    return true
  } else {
    const groups = Meteor.user()?.groupList

    if (groups && groups.length > 0) {
      return Tasks.find({
        $and: [
          { "key": taskKey },
          { $or: [
              { "customHeaders.allowedGroups": {$in: Meteor.user()?.groupList} },
              { "variables.assigneeSciper": Meteor.user()?._id }
            ]
          }
        ]
      }).count() > 0
    } else {
      return Tasks.find({
        $and: [
          { "key": taskKey },
          { "variables.assigneeSciper": Meteor.user()?._id }
        ]
      }).count() > 0
    }
  }
}

export const canStartProcessInstance = () : boolean => {
  return (Meteor.user()!.isProgramAssistant || Meteor.user()!.isAdmin)
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
