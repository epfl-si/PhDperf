import {Tasks} from "/imports/model/tasks";


export const setIndexes = () => {
  Tasks.createIndex({
    "journal.lastSeen": 1,
    "journal.submittedAt": 1,
    "variables.assigneeSciper": 1,
    "variables.phdStudentSciper": 1,
    "variables.programAssistantSciper": 1,
    "variables.doctoralProgramName": 1
  }, {
    name: 'users listing their own tasks'
  })

  Tasks.createIndex({
    "journal.lastSeen": 1,
    "variables.assigneeSciper": 1,
    "journal.submittedAt": 1
  }, {
    name: 'maybe admin listing all tasks'
  })

  Tasks.createIndex({
    "_id": 1,
    "journal.submittedAt": 1
  }, {
    name: 'to assert task for a user is not already submitted'
  })
}
