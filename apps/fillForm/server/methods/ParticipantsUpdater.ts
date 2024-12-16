import {Task} from "/imports/model/tasks";
import {getParticipantsToUpdateFromEnv, getParticipantsToUpdateFromSciper} from "/server/userFetcher";
import {auditLogConsoleOut} from "/imports/lib/logging";

const auditLog = auditLogConsoleOut.extend('server/methods/TaskForm')


// Providing a form data, this function return
// updated participants, if possible
export const updateParticipantsInfoForFormData = async (
  formData: any,
  task: Task
) => {
  // update Users info, based on sciper, if possible. Block only if we don't have any data on the PhD
  let participantsToUpdate: any
  try {
    if (!task.variables.phdStudentSciper) {
      // look like a first step if we do not have the phdStudentSciper in task.variables.
      // let's fetch with formData then
      participantsToUpdate = await getParticipantsToUpdateFromSciper(formData)
    } else {
      participantsToUpdate = await getParticipantsToUpdateFromSciper(task.variables)
    }

    // on dev env. outside intranet, we may not have any result. Check if we want
    // to crawl them from .env
    if (
      ( participantsToUpdate?.length == 0) &&
      Meteor.isDevelopment &&
      Meteor.settings?.skipUsersUpdateOnFail
    ) {
      participantsToUpdate = await getParticipantsToUpdateFromEnv()
    }

    formData = { ...formData, ...participantsToUpdate }
  } catch (e: any) {
    // don't raise an error on dev env if the dev do not want it
    if (Meteor.isDevelopment && Meteor.settings?.skipUsersUpdateOnFail) {
      console.log(`As we are in a dev env and as there is an error. ${ e }`)
      console.log(`The user info will be fetched locally.`)
      if (Meteor.settings?.userUpdateWithEnv) {
        participantsToUpdate = await getParticipantsToUpdateFromEnv()
        formData = { ...formData, ...participantsToUpdate }
      }
    } else {
      if (e.name == 'AbortError') {
        // Look like the fetching of user info has got a timeout,
        // make it bad only if we don't have already some data, or ignore it
        auditLog(`Error: Timeout while fetching scipers.`)
        if (!task.variables.phdStudentEmail) throw new Meteor.Error(422, 'Unable to get users information, aborting. Please contact the administrator or try again later.')
      } else {
        auditLog(`Error: parsing a participant ${ e } has failed. Aborting.`)
        throw new Meteor.Error(422, `There is a problem with a participant: ${ e }`)
      }
    }
  }


  return formData
}
