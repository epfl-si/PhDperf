import {encrypt} from "/server/encryption";
import {NotificationStartMessage} from "phd-assess-meta/types/notification";
import {zBClient} from "/server/zeebe/connector";
import {Meteor} from "meteor/meteor";
import {getUserPermittedTaskReminder} from "/imports/policy/reminders";
import {onZeebeReminderCreated} from "/imports/api/reminderLogs/helpers";

const debug = require('debug')('server/methods/Reminders')

type reminderSubmitData = {
  subject: string
  message: string
  to: string
  cc: string | undefined
  bcc: string | undefined
}

Meteor.methods({
  async sendReminder(
    taskId,
    reminderFormData: reminderSubmitData
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

    const incomingFromDataEmailToString = ( emailsInput: string): string[] => {
      // accept ',' and ';'
      emailsInput = emailsInput.replace(/;/g, ',');
      return emailsInput.split(',').map(email => email.trim());
    }

    const reminderTo = incomingFromDataEmailToString(reminderFormData.to)
    const reminderCc = reminderFormData.cc ? incomingFromDataEmailToString(reminderFormData.cc) : undefined
    const reminderBcc = reminderFormData.bcc ? incomingFromDataEmailToString(reminderFormData.bcc) : undefined

    debug(`Publishing Zeebe Message as a notification start...`)

    await zBClient!.publishMessage({
      correlationKey: task.variables.uuid,
      name: 'Message_notify',
      variables: {
        to: reminderTo.map( to => encrypt(to) ),
        cc: reminderCc ? reminderCc.map( cc => encrypt(cc) ) : undefined,
        bcc: reminderBcc ? reminderBcc.map( bcc => encrypt(bcc) ) : undefined,
        subject: encrypt(reminderFormData.subject),
        message: encrypt(reminderFormData.message),
        fromElementId: encrypt(`${task.elementId}`),
        pdfType: task.customHeaders.pdfType ? encrypt(task.customHeaders.pdfType) : undefined,
        pdfName: task.customHeaders.pdfName ? encrypt(task.customHeaders.pdfName) : undefined,
        type: encrypt('reminder'),
      } as NotificationStartMessage
    })

    debug(`Published Zeebe message for a new reminder.`)

    await onZeebeReminderCreated(task)
  },
})
