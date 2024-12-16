import {PhDInputVariables} from "/imports/model/tasksTypes";
import {Job} from "zeebe-node";
import {Sciper} from "/imports/api/datatypes";
import {ParticipantList} from "/imports/model/participants";
import {ActivityLog} from "/imports/api/activityLogs/schema";
import {ReminderLog} from "/imports/api/reminderLogs/schema";


export const taskFieldsNeededForDashboard = {
  '_id': 1,
  'elementId': 1,
  'processInstanceKey': 1,
  'variables.dashboardDefinition': 1,
  'variables.assigneeSciper': 1,
  'variables.created_at': 1,
  'variables.updated_at': 1,
  'variables.phdStudentSciper': 1,
  'variables.phdStudentEmail': 1,
  'variables.phdStudentName': 1,
  'variables.phdStudentLastNameUsage': 1,
  'variables.phdStudentFirstNameUsage': 1,
  'variables.thesisDirectorSciper': 1,
  'variables.thesisDirectorEmail': 1,
  'variables.thesisDirectorName': 1,
  'variables.thesisDirectorFirstNameUsage': 1,
  'variables.thesisDirectorLastNameUsage': 1,
  'variables.thesisCoDirectorSciper': 1,
  'variables.thesisCoDirectorEmail': 1,
  'variables.thesisCoDirectorName': 1,
  'variables.thesisCoDirectorFirstNameUsage': 1,
  'variables.thesisCoDirectorLastNameUsage': 1,
  'variables.programDirectorSciper': 1,
  'variables.programDirectorEmail': 1,
  'variables.programDirectorName': 1,
  'variables.programDirectorFirstNameUsage': 1,
  'variables.programDirectorLastNameUsage': 1,
  'variables.programAssistantSciper': 1,
  'variables.programAssistantEmail': 1,
  'variables.programAssistantName': 1,
  'variables.programAssistantFirstNameUsage': 1,
  'variables.programAssistantLastNameUsage': 1,
  'variables.mentorSciper': 1,
  'variables.mentorName': 1,
  'variables.mentorFirstNameUsage': 1,
  'variables.mentorLastNameUsage': 1,
  'variables.mentorEmail': 1,
  'variables.doctoralProgramName': 1,
  'variables.uuid': 1,
  'variables.mentorDate': 1,  // for checking if the values is submitted
  'variables.dueDate': 1,
}

// define here what is allowed in code, as we filter out a full task to get only useful data
type UnwantedPhDInputVariablesKeys = "created_by"

export type PhDInputVariablesDashboard = Omit<PhDInputVariables, UnwantedPhDInputVariablesKeys>

// like the 'Task implements TaskI', minus the unused fields
export interface ITaskDashboard<WorkerInputVariables = PhDInputVariablesDashboard, CustomHeaderShape = {}> extends Job<WorkerInputVariables, CustomHeaderShape> {
  _id: string
  elementId: string
  updated_at?: Date  // value built from variables.updated_at, see the Task class for details
  processInstanceKey: string
  assigneeScipers?: Sciper[]
  participants: ParticipantList  // values built from participants found in the 'variables' fields, see the Task class for details
  activityLogs: ActivityLog[]
  reminderLogs: ReminderLog[]
}
