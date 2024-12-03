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

    await WorkersClient.success(task._id!, formData)
    auditLog(`Sending success: job ${task._id} of process instance ${task.processInstanceKey} with data ${JSON.stringify(formData)}`)

    // cleanup temp forms
    await UnfinishedTasks.removeAsync({ taskId: task._id!, userId: user._id })
    await UnfinishedTasks.removeAsync({
      userId: user._id,
      processInstanceKey: task.processInstanceKey,
      stepId: task.elementId,
    })

    Tasks.markAsSubmitted(task._id!)
  },

  async saveAsUnfinishedTask(taskId, formData) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = await Meteor.users.findOneAsync({_id: this.userId}) ?? null
    }

    if (!user) return

    const task = await Tasks.findOneAsync(
      { _id: taskId },
      { fields: {
          processInstanceKey: 1,
          elementId: 1,
        }
      }
    )

    await UnfinishedTasks.updateAsync({
        userId: user._id,
        taskId: taskId
      }, {
      $set: {
        userId: user._id,
        taskId: taskId,
        inputJSON: formData,
        updatedAt: dayjs().toDate(),
        processInstanceKey: task?.processInstanceKey ?? undefined,
        stepId: task?.elementId ?? undefined,
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

    let unfinishedTask = await UnfinishedTasks.findOneAsync(
      { userId: user._id, taskId: taskId }
    )

    // can't find one ? let's check if the cause is
    // the change of a variable that created a new job
    if (!unfinishedTask) {
      const task = await Tasks.findOneAsync(
        { _id: taskId },
        { fields: {
            processInstanceKey: 1,
            elementId: 1,
          }
        }
      )

      if (task) {
        unfinishedTask = await UnfinishedTasks.findOneAsync({
            userId: user._id,
            processInstanceKey: task.processInstanceKey,
            stepId: task.elementId
          }
        )
      }
    }

    return unfinishedTask
  },
})
