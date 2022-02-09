import {ImportScipersList} from "/imports/api/importScipers/schema";
import {Tasks} from "/imports/model/tasks";


/*
 * Set events on tasks changes, to reflect the status on ImportScipers lists
 */
const getQuery = () => { return {} }
const getUpdateDocument = (hasAlreadyStarted: boolean) => {
  return {
    $set: {
      "doctorants.$[doctorantInfo].hasAlreadyStarted": hasAlreadyStarted,
      "doctorants.$[doctorantInfo].isBeingImported": false,
      "doctorants.$[doctorantInfo].isSelected": false,
    }
  }
}

const getOptions = (doctorantSciper: string) => {
  return {
    arrayFilters: [{
      "doctorantInfo.doctorant.sciper": doctorantSciper
    }]
  }
}

export const observeTasksForImportScipers = () => {
  Tasks.find({}).observe({
    added: (task) => {
      if (task.variables?.phdStudentSciper) {
        ImportScipersList.update(getQuery(), getUpdateDocument(true), getOptions(task.variables.phdStudentSciper))
      }
    },
    changed: (new_task, old_task) => {
      const oldStudentSciper = old_task.variables?.phdStudentSciper
      const newStudentSciper = new_task.variables?.phdStudentSciper
      if (oldStudentSciper && newStudentSciper && oldStudentSciper !== newStudentSciper) {
        ImportScipersList.update(getQuery(), getUpdateDocument(true), getOptions(newStudentSciper))
        ImportScipersList.update(getQuery(), getUpdateDocument(false), getOptions(oldStudentSciper))
      }
    },
    removed: (task) => {
      if (task.variables?.phdStudentSciper) {
        ImportScipersList.update(getQuery(), getUpdateDocument(false), getOptions(task.variables.phdStudentSciper))
      }
    }
  })
}
