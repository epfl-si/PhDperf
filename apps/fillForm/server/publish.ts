import {Meteor} from "meteor/meteor";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema"
import {ImportScipersList} from "/imports/api/importScipers/schema"
import {
  getUserPermittedTaskDetailed
} from "/imports/policy/tasks";
import {getUserPermittedTasksForDashboard} from "/imports/policy/dashboard/tasks";
import {getUserPermittedTasksForList} from "/imports/policy/tasksList/tasks";
import {canEditAtLeastOneDoctoralSchool, canEditDoctoralSchool} from "/imports/policy/doctoralSchools";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {Task, Tasks, isObsolete} from "/imports/model/tasks";
import {refreshAlreadyStartedImportScipersList} from "/imports/api/importScipers/helpers";
import _ from "lodash";


Meteor.publish('taskDetailed', function (args: [string]) {
  if (this.userId) {
    const user = Meteor.users.findOne({ _id: this.userId }) ?? null
    return getUserPermittedTaskDetailed(user, args[0])
  } else {
    this.ready()
  }
})

Meteor.publish('tasksList', function () {
  if (this.userId) {
    const user = Meteor.users.findOne({ _id: this.userId }) ?? null

    // we do not send directly the journal.lastSeen on tasks list, as it trigger updates all the time.
    // Instead, we provide a new boolean attribute 'isObsolete' that changes only when his time as come
    const tasksList = getUserPermittedTasksForList(user)

    if (!user || !tasksList) {
      this.ready()
    } else {
      const handle = tasksList.observeChanges({
        added: (id, fields) => {
          this.added('tasks',  id,{
            isObsolete: isObsolete(fields.journal?.lastSeen),
            ..._.omit(fields, 'journal.lastSeen')
          })
        },
        changed: (id, fields) => {
          this.changed('tasks', id,{
            isObsolete: isObsolete(fields.journal?.lastSeen),
            ..._.omit(fields, 'journal.lastSeen')
          })
        },
        removed: (id: string) => {
          this.removed('tasks', id)
        }
      })

      this.ready()

      if (handle) this.onStop(() => handle.stop());
    }
  } else {
    this.ready()
  }
})

Meteor.publish('tasksDashboard', function () {
  if (!this.userId) return this.ready()

  const user = Meteor.users.findOne({_id: this.userId}) ?? null

  if (!user) return this.ready()

  // Set a custom handler for users, as we don't want to show the AssigneeSciper when the mentor task is going on
  const handle = getUserPermittedTasksForDashboard(user, DoctoralSchools.find({}).fetch())?.observeChanges({
    added: (id, task) => {
      // remove assigneeSciper for mentor task if
      //   - task is currently on the mentor task
      //   - assigneeSciper is not the mentor, nor the students, as they are allowed to know each other
      if (!user.isAdmin) {
        if (task.elementId === 'Activity_Post_Mentor_Meeting_Mentor_Signs' &&
          task.variables?.assigneeSciper
        ) {

          const isCurrentUserTheStudentOrTheMentor = (task: Partial<Task>) => {
            return (
              user._id === task.variables!.phdStudentSciper ||
              user._id === task.variables!.mentorSciper
            )
          }

          if (!isCurrentUserTheStudentOrTheMentor(task)) {
            task.variables.assigneeSciper = ''
            task.assigneeScipers = []
          }
        }
      }

      this.added('tasks', id, task);
    },
    removed: (id) => {
      this.removed('tasks', id)
    }
  })

  this.ready()

  if (handle) this.onStop(() => handle.stop());
})

Meteor.publish('doctoralSchools', function() {
  let user: Meteor.User | null = null
  if (this.userId) {
    user = Meteor.users.findOne({_id: this.userId}) ?? null
  }

  if (user && canEditAtLeastOneDoctoralSchool(user)) {
    const sub = DoctoralSchools.find({}).observeChanges({
        added: (id, data) => {
          const ds = DoctoralSchools.findOne({_id: id});
          this.added('doctoralSchools', id, {...data, readonly: !(ds && canEditDoctoralSchool(user, ds))});
        },
        changed : (id, data) => {
          const ds = DoctoralSchools.findOne({_id: id});
          this.changed('doctoralSchools', id, {...data, readonly: !(ds && canEditDoctoralSchool(user, ds))});
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
    this.ready()
  }
})

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
