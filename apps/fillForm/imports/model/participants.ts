import {Sciper} from "/imports/api/datatypes";
import {PhDInputVariables} from "/imports/model/tasksTypes";


export enum ParticipantRoles {
  PhdStudent = "phdStudent",
  ThesisDirector = "thesisDirector",
  ThesisCoDirector = "thesisCoDirector",
  Mentor = "mentor",
  ProgramDirector = "programDirector",
  ProgramAssistant = "programAssistant"
}

export type ParticipantDetail = {
  sciper: Sciper;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
};

export type ParticipantList = Partial<Record<ParticipantRoles, ParticipantDetail>>;

/*
 * Transform incoming Zeebe variables about the participant, to get a ParticipantList
 */
export const participantsFromZeebe = (variables: PhDInputVariables): ParticipantList =>  {
  let participants: ParticipantList = {}

  // Fetch variables by participant, and get that new Participant from it
  for (let participantID of Object.values(ParticipantRoles)) {
    if (`${participantID}Sciper` in variables && variables[`${participantID}Sciper`]) {
      try {
        participants[participantID] = {
          sciper: variables[`${participantID}Sciper`]!,
          email: variables[`${participantID}Email`]!,
          name: variables[`${participantID}Name`]!,
          firstName: variables[`${participantID}FirstNameUsage`]!,
          lastName: variables[`${participantID}LastNameUsage`]!,
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
