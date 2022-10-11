import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {findFieldKeysToSubmit} from "/imports/lib/formIOUtils"
import _ from "lodash";
import { Mongo } from 'meteor/mongo';
const debug = require('debug')('import/policy/tasks.ts')

export const canSeeMentorInfos = () : boolean => {
  return !!Meteor.user()?.isAdmin
}

/*
 * Set specific finder when a user is not admin.
 * Has it is a quiet complex finder used multiple time, you can find it as a function here
 */
const buildTaskQuery = (taskQuery: any, user: Meteor.User) => {
  if (user.isAdmin) {
    return taskQuery
  } else {
    const groups = user.groupList

    if (groups && groups.length > 0) {
      taskQuery['$or'] = [
        {"customHeaders.allowedGroups": {$in: groups}},  // Get tasks for the group
        {"variables.assigneeSciper": user._id},  // Get assigned tasks
      ]
    } else {
      taskQuery["variables.assigneeSciper"] = user._id
    }
    return taskQuery
  }
}

// set which fields can be seen, by admins or by a user
const buildTaskFields = (user: Meteor.User) => {

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

  if (user.isAdmin) {  // remove exclusion if admin
    delete fieldsView['variables.mentorSciper']
    delete fieldsView['variables.mentorName']
    delete fieldsView['variables.mentorEmail']
    delete fieldsView['variables.activityLogs']
  }

  return fieldsView
}

export const get_user_permitted_task = (_id: string) => {  // when crawling for one task, we get more info, like the FormIO definition
  const user = Meteor.user()

  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const fieldsView = buildTaskFields(user)
  const taskQuery = buildTaskQuery({ _id: _id }, user)  //get only the task needed

  return Tasks.find(taskQuery, { 'fields': fieldsView })
}

// Define which tasks can be seen from the task list
// use withoutFormDef to specifiy if you need the formIO definition
export const get_user_permitted_tasks = (excludeFormDefinition: boolean = true) => {  // to show as list, simplified
  const user = Meteor.user()

  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return
  const fieldsView = buildTaskFields(user)
  const taskQuery = buildTaskQuery({}, user)  //get only the task needed

  if (excludeFormDefinition) {  // should we exclude data that is about the form (useful on view without showing the form)
    fieldsView['customHeaders.formIO'] = 0
  }

  return Tasks.find(taskQuery, { 'fields': fieldsView })
}

// Define which tasks can be seen from the dashboard
export const get_user_permitted_tasks_dashboard = () => {
  const user = Meteor.user()

  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return
  const fieldsView = buildTaskFields(user)
  const taskQuery = buildTaskQuery({}, user)  //get only the task needed

  // remove unused "too big" fields
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
