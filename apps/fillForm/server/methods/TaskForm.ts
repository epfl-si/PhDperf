import {Meteor} from "meteor/meteor";
import dayjs from "dayjs";

import {encrypt} from "/server/encryption";
import {Tasks, UnfinishedTasks} from "/imports/model/tasks";
import {FormioActivityLog} from "/imports/model/tasksTypes";
import {canSubmit, getUserPermittedTaskDetailed} from "/imports/policy/tasks";
import _ from "lodash";

import WorkersClient from '../zeebe_broker_connector'
import {auditLogConsoleOut} from "/imports/lib/logging";

import {filterUnsubmittableVars} from "/imports/policy/utils";
import {updateParticipantsInfoForFormData} from "/server/methods/ParticipantsUpdater";
import {ActivityLog} from "phd-assess-meta/types/activityLog";
import {bumpActivityLogsAfterSubmittedTask} from "/server/methods/Activity";

const auditLog = auditLogConsoleOut.extend('server/methods/TaskForm')
const debug = require('debug')('server/methods/TaskForm')


Meteor.methods({

  async getTaskForm(_id) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    const task = getUserPermittedTaskDetailed(user, _id)?.fetch()

    if (task && task[0]) {
      return task[0]
    } else {
      auditLog(`Error: the task that is trying to be edited can not be found or the user has no the correct rights. Task key requested: ${_id}.`)
      throw new Meteor.Error('404', `The task ID can not be find. It may not exists, or your are not allowed to get it.`)
    }
  },

  async submit(_id, formData, _formMetaData: FormioActivityLog) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    const task = Tasks.findOne({_id: _id})
    if (!task) {
      auditLog(`Error: the task that is being submitted can not be found. Task key requested: ${_id}.`)
      throw new Meteor.Error(404, 'Unknown task', 'The task does not exist anymore.')
    }

    if (!canSubmit(user, _id)) {
      auditLog(`Unallowed user ${user._id} is trying to submit the task ${_id}`)
      throw new Meteor.Error(403, 'You are not allowed to submit this task')
    }

    formData = filterUnsubmittableVars(
      formData,
      task.customHeaders.formIO,
      ['cancel', 'submit'],
      [
        'created_at',
        'created_by',
      ]
    )

    if (formData.length == 0) {
      auditLog(`Error: the form being submitted by ${user._id} as insufficient data.`)
      throw new Meteor.Error(400, 'There is not enough valid data to validate this form. Canceling.')
    }

    formData = await updateParticipantsInfoForFormData(formData, task)

    formData.updated_at = new Date().toJSON()

    // create the activity info for this step
    const activityLog: ActivityLog = {
      event: 'completed',
      elementId: task.elementId,
      datetime: new Date().toJSON()
    }
    // save the activity into this Zeebe variable, as it will be saved into activityLogs by the BPMN
    formData.activityLog = JSON.stringify(activityLog)

    // encrypt all data
    formData = _.mapValues(formData, x => encrypt(x))

    await WorkersClient.success(task._id!, formData)
    auditLog(`Sending success: job ${task._id} of process instance ${task.processInstanceKey} with data ${JSON.stringify(formData)}`)

    debug(`Bumping all activity logs about the submit`)
    await bumpActivityLogsAfterSubmittedTask(task, activityLog)

    debug(`Clear the temp form, if any`)
    await UnfinishedTasks.removeAsync({ taskId: task._id!, userId: user._id })

    debug(`Save as submitted in the local db, for journaling operations`)
    Tasks.markAsSubmitted(task._id!)
  },

  async saveAsUnfinishedTask(taskId, formData) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = await Meteor.users.findOneAsync({_id: this.userId}) ?? null
    }

    if (!user) return

    await UnfinishedTasks.updateAsync(
      { userId: user._id, taskId: taskId },
      { $set: {
          userId: user._id, taskId: taskId, inputJSON: formData, updatedAt: dayjs().toDate()
        }
      },
      { upsert: true}
    )
  },

  async getUnfinishedTask(taskId) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = await Meteor.users.findOneAsync({_id: this.userId}) ?? null
    }

    if (!user) return

    return await UnfinishedTasks.findOneAsync({ userId: user._id, taskId: taskId })
  },
})
