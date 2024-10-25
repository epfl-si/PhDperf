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

const auditLog = auditLogConsoleOut.extend('server/methods/TaskForm')


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

  async submit(_id, formData, formMetaData: FormioActivityLog) {
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

    formData = _.mapValues(formData, x => encrypt(x))  // encrypt all data

    // append the current activity over other activities
    // but only keep the pathName of the current task, as it inform about the jobId
    const jobURLs = []

    if (task.variables.activityLogs) {  // do we have already some activities logged ?
      let activitiesLogs: FormioActivityLog[] = JSON.parse(task.variables.activityLogs)
      // cleanup other data that were put inside in old code, only keep pathName
      for (let activitiesLog of activitiesLogs) {
        jobURLs.push(_.pick(activitiesLog, 'pathName'))
      }
    }

    jobURLs.push(_.pick(formMetaData, 'pathName'))  // push the actual one

    formData.activityLogs = encrypt(JSON.stringify(jobURLs))

    await WorkersClient.success(task._id!, formData)
    auditLog(`Sending success: job ${task._id} of process instance ${task.processInstanceKey} with data ${JSON.stringify(formData)}`)
    await UnfinishedTasks.removeAsync({ taskId: task._id!, userId: user._id })
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
