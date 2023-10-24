import {Meteor} from "meteor/meteor";
import _ from "lodash"

import {auditLogConsoleOut} from "/imports/lib/logging";
import {Tasks} from "/imports/model/tasks";
import WorkersClient from "/server/zeebe_broker_connector";
import {PublishMessageRequest} from "zeebe-node/dist/lib/interfaces-grpc-1.0";
import {encrypt} from "/server/encryption";
import {PublishMessageResponse} from "zeebe-node";
import {Sciper} from "/imports/api/datatypes";
import {getParticipantsToUpdateFromSciper} from "/server/userFetcher";
import {PhDInputVariables} from "/imports/model/tasksTypes";
import {canEditParticipants} from "/imports/policy/tasks";
import {ParticipantRoles} from "/imports/model/participants";

const auditLog = auditLogConsoleOut.extend('server/methods/TaskParticipants')


export type EditableParticipant = {
  role:
    Omit<ParticipantRoles, 'phdStudent'>
  sciper: Sciper
}

const validRoles = [
  'programAssistant',
  'thesisDirector',
  'thesisCoDirector',
  'programDirector',
  'mentor',
]

Meteor.methods({

  async updateTaskParticipants(taskId, participantData: EditableParticipant){
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    const task = Tasks.findOne({_id: taskId})

    if (!canEditParticipants(user)) throw new Meteor.Error(
      403,
      'You are not allowed to edit the participants',
    )

    if (!task) throw new Meteor.Error(
      404,
      'This task does not exist.',
    )

    if (!task.variables.uuid) throw new Meteor.Error(
      409,
      'This task has no uuid, it can not be used to edit participants',
    )

    if (!validRoles.includes(participantData.role as string)) throw new Meteor.Error(
      409,
      `Payload is not correct. Role ${participantData.role} is unknown`,
    )

    // only the thesisCoDirector can be empty/set to nothing
    if (participantData.role !== 'thesisCoDirector' &&
      !participantData.sciper
    ) throw new Meteor.Error(
      409,
      `Payload is not correct. Only the thesisCoDirector field can be empty`,
    )

    // prepare the data
    // by default, set the other values for this participant to empty, in case of the userFetcher API fails
    let participants = {
      [`${participantData.role}Sciper`]: participantData.sciper,
      [`${participantData.role}Name`]: '',
      [`${participantData.role}Email`]: '',
    }

    // only do this part if we are not emptying the thesisCoDirector
    if (!(participantData.role === 'thesisCoDirector' && !participantData.sciper)) {

      // let's try to fulfill the missing information
      try {
        participants = await getParticipantsToUpdateFromSciper(participants as PhDInputVariables)
        participants[`${ participantData.role }Sciper`] = participantData.sciper  // bring back the new forgotten sciper
      } catch (e: any) {
        if (Meteor.isDevelopment && Meteor.settings?.skipUsersUpdateOnFail) {  // don't raise an error it optional on dev env.
          console.log(`skipping the user update for dev env, as there is an error. ${ e }`)
        } else {
          if (e.name == 'AbortError') {
            // Look like the fetching of user info has got a timeout,
            throw new Meteor.Error(422, 'Unable to get users information, aborting. Please contact the administrator or try again later.')
          } else {
            throw new Meteor.Error(422, `There is a problem with a participant: ${ e }`)
          }
        }
      }

      // validity check before sending to Zeebe
      if (!participants[`${ participantData.role }Name`] ||
        !participants[`${ participantData.role }Email`]) {
        throw new Meteor.Error(422, `Aborting the change : Unable to find any users information for the sciper "${ participantData.sciper }".`)
      }
    }

    const publishResponse: PublishMessageResponse = await WorkersClient.publishMessage({
      name: 'Message_update_participants',
      // timeToLive: Duration.seconds.of(10),
      correlationKey: task.variables.uuid,
      // messageId: uuid.v4(),
      variables: _.mapValues(participants, x => x ? encrypt(x) : '' )
    } as PublishMessageRequest)

    // all jobs have to be reset
    const concernedTasks = Tasks.find({
      processInstanceKey: task.processInstanceKey
      }
    )

    for (const taskForThisProcess of concernedTasks) {
      await WorkersClient.refreshTask(taskForThisProcess)
    }

    auditLog(`Changed the participants of the instance ${task.processInstanceKey}. Publish response: ${JSON.stringify(publishResponse)}`)
  },
})
