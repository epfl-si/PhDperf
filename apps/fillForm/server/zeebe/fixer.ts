/**
 * This file compile code that is used to fix variables coming from Zeebe.
 * The jobs may need a fix when we update the BPMN but there is still
 * some old workflows running
 */

import {ParticipantRoles} from "/imports/model/participants";
import {PhDInputVariables} from "/imports/model/tasksTypes";


const fetchFirstNameFromName = ( name: string | undefined | null ) => {
  if (!name) return

  return name.split(' ').slice(  // for workflows not already gone through the new api
    0, (
      (name.split(' ').length - 1) >= 1 ?
        name.split(' ').length - 1 :
        1
    )
  )?.join(' ')
}

const fetchLastNameFromName = ( name: string | undefined | null ) => {
  if (!name) return

  return name.split(' ')[name.split(' ').length-1]
}

/*
 * In some old cases, the firstNameUsage and lastNameUsage was not set, only the name. Fix this with this.
 * @returns The variables with the new values set
 */
export const fixFirstLastName = ( taskVariables: Partial<PhDInputVariables> ) => {

  for (let participantID of Object.values(ParticipantRoles)) {
    // when do we want to fix ?
    if (
      (
        !(`${ participantID }FirstNameUsage` in taskVariables) ||
        !(`${ participantID }LastNameUsage` in taskVariables)
      ) &&
      `${ participantID }Name` in taskVariables // at least have this
    ) {
      const firstNameUsage = fetchFirstNameFromName( taskVariables[`${ participantID }Name`] )
      const lastNameUsage = fetchLastNameFromName( taskVariables[`${ participantID }Name`] )

      if (firstNameUsage && lastNameUsage) {
        taskVariables = {
          ...taskVariables,
          ...{
            [`${ participantID }FirstNameUsage`]: firstNameUsage,
            [`${ participantID }LastNameUsage`]: lastNameUsage
          },
        }
      }
    }
  }

  return taskVariables
}
