import {Meteor} from "meteor/meteor";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {refreshAlreadyStartedImportScipersList} from "/imports/api/importScipers/helpers";
import {ImportScipersList} from "/imports/api/importScipers/schema";
import {Tasks} from "/imports/model/tasks";


Meteor.publish('importScipersList', function(doctoralSchoolAcronym: string) {
  let user: Meteor.User | null = null
  if (this.userId) {
    user = Meteor.users.findOne({_id: this.userId}) ?? null
  }

  if (user && canImportScipersFromISA(user)) {
    let initializing = true;

    /*
     * Helper to change the hasAlreadyStarted value in the published collection
     */
    const changePublishedImportScipersList = (subscription: Subscription,
                                              hasAlreadyStarted: boolean,
                                              doctorantSciper: string) => {
      refreshAlreadyStartedImportScipersList(doctoralSchoolAcronym, hasAlreadyStarted, doctorantSciper)

      const currentImport = ImportScipersList.findOne({ _id: doctoralSchoolAcronym })

      const activatedDoctorants = currentImport?.doctorants ? currentImport.doctorants.map((doctorant) => {
        return doctorant.doctorant.sciper === doctorantSciper ?
          { ...doctorant, hasAlreadyStarted: hasAlreadyStarted, isBeingImported: false } :
          doctorant
      }) : []

      subscription.changed('importScipersList', doctoralSchoolAcronym, {'doctorants': activatedDoctorants})
    }

    /*
    * Set observer events on tasks changes, to reflect the status on ImportScipers lists
    */
    const handle = Tasks.find({}).observe({
      added: (task) => {
        if (!initializing && task.variables?.phdStudentSciper) {
          changePublishedImportScipersList(this, true, task.variables.phdStudentSciper)
        }
      },
      changed: (new_task, old_task) => {
        const oldStudentSciper = old_task.variables?.phdStudentSciper
        const newStudentSciper = new_task.variables?.phdStudentSciper
        if (oldStudentSciper && newStudentSciper && oldStudentSciper !== newStudentSciper) {
          changePublishedImportScipersList(this, true, newStudentSciper)
          changePublishedImportScipersList(this, false, oldStudentSciper)
        }
      },
      removed: (task) => {
        if (!initializing && task.variables?.phdStudentSciper) {
          changePublishedImportScipersList(this, false, task.variables.phdStudentSciper)
        }
      }
    })

    initializing = false

    // Stop observing the cursor when the client unsubscribes. Stopping a
    // subscription automatically takes care of sending the client any `removed`
    // messages.
    this.onStop(() => handle.stop());

    return ImportScipersList.find({ _id: doctoralSchoolAcronym })
  } else {
    this.ready()
  }
})
