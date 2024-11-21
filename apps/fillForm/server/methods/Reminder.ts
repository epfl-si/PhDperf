import {encrypt} from "/server/encryption";
import {NotificationLog, NotificationStartMessage} from "phd-assess-meta/types/notification";
import {zBClient} from "/server/zeebe_broker_connector";
import WorkersClient from "/server/zeebe_broker_connector";
import {Meteor} from "meteor/meteor";
import {Task, Tasks} from "/imports/model/tasks";
import {getUserPermittedTaskReminder} from "/imports/policy/reminders";

const debug = require('debug')('server/methods/Reminders')


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

    // simulate the add to the notification logs for this task,
    // the real one should be done in Zeebe very soon
    await updateTaskWithASimulatedReminder(
      task,
      reminderTo,
      reminderCc ?? [],
      reminderBcc ?? [],
      true
    )
  },
})
