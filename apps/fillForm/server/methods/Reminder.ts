import {encrypt} from "/server/encryption";
import {NotificationLog, NotificationStartMessage} from "phd-assess-meta/types/notification";
import {PhDZeebeJob, zBClient} from "/server/zeebe_broker_connector";
import {Meteor} from "meteor/meteor";
import {Task, Tasks} from "/imports/model/tasks";
import {getUserPermittedTaskReminder} from "/imports/policy/reminders";

const debug = require('debug')('server/methods/Reminders')

// ok, notification call has been sent. As we don't want to wait for a task refresh to get the real value
// of when the message has been sent, we update the local data only (leave Zeebe fill the variables.notificationLogs by itself)
// but update the task so the notificationLogs look like it has been sent.
export const updateTaskWithASimulatedReminder = async (
  task: Task | PhDZeebeJob,
  to: string[],
  cc: string[],
  bcc: string[],
  isReminder: boolean
) => {
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
    type: isReminder ? 'reminder' : 'pending',
  } as NotificationLog

  await Tasks.updateAsync(
    { _id: task.key },
    { $push: {
        'variables.notificationLogs': JSON.stringify(notificationLog)
      }}
  )
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
