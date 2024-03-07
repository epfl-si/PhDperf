import {Sciper} from "/imports/api/datatypes";
import {PhDInputVariables} from "/imports/model/tasksTypes";


export const ParticipantIDs: ParticipantRoles[] = [
  "phdStudent" ,
  "thesisDirector" ,
  "thesisCoDirector" ,
  "mentor",
  "programDirector" ,
  "programAssistant" ,
]

export type ParticipantRoles =
  "phdStudent" |
  "thesisDirector" |
  "thesisCoDirector" |
  "mentor" |
  "programDirector" |
  "programAssistant"

export type ParticipantDetail = {
  sciper: Sciper
  email: string
  name: string
}

export type ParticipantList = { [P in ParticipantRoles]?: ParticipantDetail }

/*
 * Transform incoming Zeebe variables about the participant, to get a ParticipantList
 */
export const participantsFromZeebe = (variables: PhDInputVariables): ParticipantList =>  {
  let participants: ParticipantList = {}

  // Fetch variables by participant, and get that new Participant from it
  for (let participantID of ParticipantIDs) {
    if (`${participantID}Sciper` in variables && variables[`${participantID}Sciper`]) {
      try {
        participants[participantID] = {
          sciper: variables[`${participantID}Sciper`]!,
          email: variables[`${participantID}Email`]!,
          name: variables[`${participantID}Name`]!,
        }
      } catch (e) {
        if (e instanceof ReferenceError) {
          // TODO: see later what to do on error (should stop the workflow with an error)
          throw e
        } else {
          throw e
        }
      }
    }
  }

  return participants
}
