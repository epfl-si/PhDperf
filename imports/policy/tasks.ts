import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/api/tasks";
import {findFieldKeysToSubmit} from "/imports/lib/formIOUtils";
import _ from "lodash";
const debug = require('debug')('import/policy/tasks.ts')

export const get_user_permitted_tasks = () => {
  if (Meteor.user()?.isAdmin) {
    return Tasks.find({})
  } else {
    const groups = Meteor.user()?.groupList

    return Tasks.find({
      $or: [
        {"customHeaders.allowedGroups": {$in: groups}},  // Get tasks for the group
        {"variables.assigneeSciper": Meteor.user()?._id},  // Get assigned tasks
      ]
    })
  }
}

export const canSubmit = (taskKey: string) : boolean => {
  if (Meteor.user()?.isAdmin) {
    return true
  }

  return Tasks.find({$and : [
      {
        "key": taskKey
      },
      {
        $or: [
          {"customHeaders.allowedGroups": {$in: Meteor.user()?.groupList}},
          {"variables.assigneeSciper": Meteor.user()?._id}
        ]
      }
    ]
    }).count() > 0
}

export const canStartProcessInstance = () : boolean => {
  return !!Meteor.user()?.isAdmin
}

export const canDeleteProcessInstance = () : boolean => {
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
