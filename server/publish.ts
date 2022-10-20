import {Meteor} from "meteor/meteor";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema"
import {ImportScipersList} from "/imports/api/importScipers/schema"
import {
  getUserPermittedTaskDetailed,
  getUserPermittedTasksForList
} from "/imports/policy/tasks";
import {getUserPermittedTasksForDashboard} from "/imports/policy/dashboard/tasks";
import {canEditAtLeastOneDoctoralSchool, canEditDoctoralSchool} from "/imports/policy/doctoralSchools";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {Tasks} from "/imports/model/tasks";
import {refreshAlreadyStartedImportScipersList} from "/imports/api/importScipers/helpers";

Meteor.publish('taskDetailed', function (args: [string]) {
  return getUserPermittedTaskDetailed(args[0])
})

Meteor.publish('tasks', function () {
  return getUserPermittedTasksForList()
})

Meteor.publish('tasksDashboard', function () {
  return getUserPermittedTasksForDashboard(DoctoralSchools.find({}).fetch())
})

Meteor.publish('doctoralSchools', function() {
  if (canEditAtLeastOneDoctoralSchool()) {
    const sub = DoctoralSchools.find({}).observeChanges({
        added: (id, data) => {
          const ds = DoctoralSchools.findOne({_id: id});
          this.added('doctoralSchools', id, {...data, readonly: !(ds && canEditDoctoralSchool(ds))});
        },
        changed : (id, data) => {
          const ds = DoctoralSchools.findOne({_id: id});
          this.changed('doctoralSchools', id, {...data, readonly: !(ds && canEditDoctoralSchool(ds))});
        },
        removed : (id) => {
          this.removed('doctoralSchools', id);
        }
      });
    this.onStop(() => {
      sub.stop();
    });
    this.ready();
  } else {
    return this.ready()
  }
})

Meteor.publish('importScipersList', function(doctoralSchoolAcronym: string) {
  if (canImportScipersFromISA()) {
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
    return this.ready()
  }
})
