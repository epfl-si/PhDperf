import {PhDInputVariables} from "/imports/model/tasksTypes";
import {Job} from "zeebe-node";
import {Sciper} from "/imports/api/datatypes";
import {ParticipantList} from "/imports/model/participants";


export const tasksMongoFields = {
  '_id': 1,
  'elementId': 1,
  'processInstanceKey': 1,
  'workflowInstanceKey': 1,
  'customHeaders.title': 1,
  'processDefinitionVersion': 1,
  'variables.assigneeSciper': 1,
  'variables.created_at': 1,
  'variables.created_by': 1,
  'variables.updated_at': 1,
  'variables.phdStudentSciper': 1,
  'variables.phdStudentEmail': 1,
  'variables.phdStudentName': 1,
  'variables.phdStudentLastName': 1,
  'variables.phdStudentFirstName': 1,
  'variables.thesisDirectorSciper': 1,
  'variables.thesisDirectorEmail': 1,
  'variables.thesisDirectorName': 1,
  'variables.thesisCoDirectorSciper': 1,
  'variables.thesisCoDirectorEmail': 1,
  'variables.thesisCoDirectorName': 1,
  'variables.programDirectorSciper': 1,
  'variables.programDirectorEmail': 1,
  'variables.programDirectorName': 1,
  'variables.doctoralProgramName': 1,
  'variables.programAssistantSciper': 1,
  'variables.programAssistantEmail': 1,
  'variables.programAssistantName': 1,
}

export const taskFieldsNeededForAdmin = {
  'variables.mentorSciper': 1,
  'variables.mentorName': 1,
  'variables.mentorEmail': 1,
  'journal.lastSeen': 1,  // to mark it on the list as obosolete
  ...tasksMongoFields
}

// define here what is allowed in code, as we filter out a full task to get only useful data
type UnwantedPhDInputVariablesKeys = "activityLogs"

type PhDInputVariablesDashboard = Omit<PhDInputVariables, UnwantedPhDInputVariablesKeys>

// like the 'Task implements TaskI', minus the unused fields
export interface ITasks<WorkerInputVariables = PhDInputVariablesDashboard, CustomHeaderShape = {}> extends Job<WorkerInputVariables, CustomHeaderShape> {
  _id: string
  elementId: string
  created_by?: Sciper  // value built from variables.updated_at, see the Task class for details
  created_at?: Date  // value built from variables.updated_at, see the Task class for details
  updated_at?: Date  // value built from variables.updated_at, see the Task class for details
  workflowInstanceKey: string
  assigneeScipers?: Sciper[]
  participants: ParticipantList  // values built from participants found in the 'variables' fields, see the Task class for details
  detail: any
  isObsolete: boolean | undefined
  monitorUri?: string
}
