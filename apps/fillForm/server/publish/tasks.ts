import {Meteor} from "meteor/meteor";
import {getUserPermittedTaskDetailed} from "/imports/policy/tasks";
import {getUserPermittedTasksForList} from "/imports/policy/tasksList/tasks";
import {isObsolete, Task} from "/imports/model/tasks";
import _ from "lodash";
import {
  canViewMentor,
  getUserPermittedTasksForDashboard,
  getUserPermittedTasksForDashboardOld
} from "/imports/policy/dashboard/tasks";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";


Meteor.publish('taskDetailed', function (args: [string]) {
  if (this.userId) {
    const user: Meteor.User | null = Meteor.users.findOne({ _id: this.userId }) ?? null
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

const hideMentor = (task: Partial<Task>) => {
  if (!task.variables) return task

  const currentMentorSciper = task.variables.mentorSciper

  if (currentMentorSciper) {
    task.variables.mentorSciper = undefined

    if (!Array.isArray(task.variables?.assigneeSciper) &&
      task.variables?.assigneeSciper === currentMentorSciper) task.variables.assigneeSciper = undefined

    if (Array.isArray(task.variables?.assigneeSciper) &&
      task.variables?.assigneeSciper.includes(currentMentorSciper)
    ) _.pull(task.variables.assigneeSciper, currentMentorSciper)

    if (task.assigneeScipers?.includes(currentMentorSciper)) _.pull(task.assigneeScipers, currentMentorSciper)
  }

  if (task.variables.mentorName) task.variables.mentorName = undefined

  if (task.variables.mentorEmail) task.variables.mentorEmail = undefined

  return task
}

Meteor.publish('tasksDashboardOld', function () {
  if (!this.userId) return this.ready()

  const user = Meteor.users.findOne({_id: this.userId}) ?? null

  if (!user) return this.ready()

  // Set a custom handler for users, as we don't want
  //   - to show the AssigneeSciper when the mentor task is going on
  //   - to show the mentor data
  const handle = getUserPermittedTasksForDashboardOld(
    user,
    DoctoralSchools.find({}).fetch()
  )?.observeChanges({
    added: (id, task) => {

      if (!canViewMentor(user, task) ) {  // not allowed to view the mentor ? let's clean all traces of it
        task = hideMentor( task );
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

Meteor.publish('tasksDashboard', function () {
  if (!this.userId) return this.ready()

  const user = Meteor.users.findOne({_id: this.userId}) ?? null

  if (!user) return this.ready()

  // Set a custom handler for users, as we don't want
  //   - to show the AssigneeSciper when the mentor task is going on
  //   - to show the mentor data
  const handle = getUserPermittedTasksForDashboard(
    user,
    DoctoralSchools.find({}).fetch()
  )?.observeChanges({
    added: (id, task) => {

      if (!canViewMentor(user, task) ) {  // not allowed to view the mentor ? let's clean all traces of it
        task = hideMentor( task );
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
