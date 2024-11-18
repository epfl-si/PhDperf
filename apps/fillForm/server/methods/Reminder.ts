import {encrypt} from "/server/encryption";
import {NotificationLog, NotificationStartMessage} from "phd-assess-meta/types/notification";
import {zBClient} from "/server/zeebe_broker_connector";
import WorkersClient from "/server/zeebe_broker_connector";
import {Meteor} from "meteor/meteor";
import {Task, Tasks} from "/imports/model/tasks";
import {getUserPermittedTaskReminder} from "/imports/policy/reminders";
import { ActivityLog } from "phd-assess-meta/types/activityLog";

const debug = require('debug')('server/methods/Reminders')

/**
 * Hack to retrieve the started date activityLog from all the task, if missing in activityLog.
 * Because of the old workflows, the value can only be found by reading the
 * notificationLogs for the first 'awaitingForm' | '' type
 */
export const retrieveStartedDateFromNotificationLogs = (
  task: Task
) => {
  // first check if the value is not already set
  const startedCurrentElementId = task.activityLogs?.filter(
    log => log.elementId === task.elementId && log.event === 'started'
  )

  if (!startedCurrentElementId) {
    // missing started for this task. Let find in notificationLogs the value
    const callForFillFormNotification = task.notificationLogs?.filter(
      log => log.fromElementId === task.elementId && log.type !== 'reminder'
    )

    if (callForFillFormNotification) {
      // found something ? update the task then
      Tasks.update(
        { _id: task.key },
        { $push: {
            'variables.activityLog': JSON.stringify({
              event: 'started',
              datetime: new Date().toJSON(),
              elementId: task.elementId
            } as ActivityLog )
          }}
      )
    }
  }
}

export const updateTaskWithASimulatedReminder = async (
  task: Task,
  to: string[],
  cc: string[],
  bcc: string[],
  isReminder: boolean
) => {
  debug(`Updating the local task ${task.key} with a new unconfirmed notificationLog...`)

  // simulate the add to the notification logs for this task, the real one will be done from Zeebe
  const notificationLog = {
    sentAt: new Date().toJSON(),
    sentTo: {
      to: to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined
    },
    // add _reminder to type, to be able to find which are reminder type
    // this is mainly a retro-compatibility trick, so old workflow can be reminded too
    fromElementId: `${ task.elementId }${ isReminder ? '_reminder' :  '' }`,
    type: isReminder ? 'reminder' : 'awaitingForm',
  } as NotificationLog

  await Tasks.updateAsync(
    { _id: task.key },
    { $push: {
        'variables.notificationLogs': JSON.stringify(notificationLog)
      }}
  )

  debug(`Updating the sibling task ${task.key} about this reminder, if any...`)
  // update sibling tasks about this notification too,
  // as the info will disappear if not done, once the task is successful
  await task.siblings?.forEachAsync( async ( siblingTask: Task ) => {
    await Tasks.updateAsync(
      { _id: siblingTask.key },
      { $push: {
          'variables.notificationLogs': JSON.stringify(notificationLog)
        }}
    )
    debug(`Sibling task ${siblingTask.key} of ${task.key} updated about this reminder.`)
  })

  ////
  // Update the service task variables too. As the task was created before the reminder is sent,
  // in a case of a local db refresh, the values will be forgotten in the service task.
  // This code aimm to prevent this fact.
  debug(`Bumping the Zeebe service task ${task.elementInstanceKey} about this reminder...`)
  const cTask = await Tasks.findOneAsync( { _id: task.key })  // fetch last values
  if (cTask) {
    // encrypt for zeebe
    const encryptedVariables = cTask.variables.notificationLogs?.map(log => encrypt(log))

    await WorkersClient.setVariables(
      cTask.elementInstanceKey,
      {
        notificationLogs: encryptedVariables
      },
      true  // prevent moving the values into the process instance scope,
      // as the value should / will be set into the process instance scope from the notifier microservice himself
    )
    debug(`Zeebe service task ${task.elementInstanceKey} bumped for the new reminder.`)
  }
}

Meteor.methods({
  async sendReminder(
    taskId,
    reminderFormData: Omit<
      NotificationStartMessage,
      'fromElementId'
      >
  ) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    const task = ( await getUserPermittedTaskReminder(user, taskId)?.fetchAsync() ?? [] )[0]

    if (!task) throw new Meteor.Error(
      403,
      'You are not allowed to send reminder for this task.'
    )

    if (!task.variables.uuid) throw new Meteor.Error(
      403,
      'This task is part of an old workflow and reminders can not be used.'
    )

    if ( !reminderFormData.to ) throw new Meteor.Error(
      400,
      'The "to" data is missing.'
    )

    if ( !reminderFormData.to ) throw new Meteor.Error(
      400,
      'The "to" is missing.'
    )

    if ( !reminderFormData.subject ) throw new Meteor.Error(
      400,
      'The "subject" is missing.'
    )

    if ( !reminderFormData.message ) throw new Meteor.Error(
      400,
      'The "message" is missing.'
    )

    const reminderTo = reminderFormData.to as string
    const reminderCc = reminderFormData.cc as string
    const reminderBcc = reminderFormData.bcc as string

    debug(`Publishing Zeebe Message as a notification start...`)

    await zBClient!.publishMessage({
      correlationKey: task.variables.uuid,
      name: 'Message_notify',
      variables: {
        to: encrypt(reminderTo),
        cc: encrypt(reminderCc),
        bcc: encrypt(reminderBcc),
        subject: encrypt(reminderFormData.subject as string),
        message: encrypt(reminderFormData.message as string),
        fromElementId: encrypt(`${task.elementId}_reminder`),
        type: encrypt('reminder'),
      } as NotificationStartMessage
    })

    debug(`Published Zeebe message for a new reminder.`)

    // simulate the add to the notification logs for this task,
    // the real one should be done in Zeebe very soon
    await updateTaskWithASimulatedReminder(
      task,
      reminderTo.split(','),
      reminderCc ? reminderCc.split(',') : [],
      reminderBcc ? reminderBcc.split(',') : [],
      true
    )
  },
})
