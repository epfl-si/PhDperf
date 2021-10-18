import {Sciper} from "/imports/api/datatypes";
import {PhDInputVariables} from "/imports/model/tasks";

type ZeebeParticipantsVariablesBase = {
  programAssistantSciper: Sciper
  programAssistantEmail: string
  programAssistantName: string

  phdStudentSciper: Sciper
  phdStudentEmail: string
  phdStudentName: string

  thesisDirectorSciper: Sciper
  thesisDirectorEmail: string
  thesisDirectorName: string

  thesisCoDirectorSciper: Sciper
  thesisCoDirectorEmail: string
  thesisCoDirectorName: string

  programDirectorSciper: Sciper
  programDirectorEmail: string
  programDirectorName: string

  mentorSciper: Sciper
  mentorEmail: string
  mentorName: string
}

// make everything optional, check is done in runtime, as we are not here to reflect what is needed in business
export type ZeebeParticipantsVariables = Partial<ZeebeParticipantsVariablesBase>

export const ParticipantIDs: ParticipantRoles[] = [
  "programAssistant" ,
  "phdStudent" ,
  "thesisDirector" ,
  "thesisCoDirector" ,
  "programDirector" ,
  "mentor",
]

export type ParticipantRoles =
  "programAssistant" |
  "phdStudent" |
  "thesisDirector" |
  "thesisCoDirector" |
  "programDirector" |
  "mentor"

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
          sciper: variables[`${participantID}Sciper`],
          email: variables[`${participantID}Email`],
          name: variables[`${participantID}Name`],
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
