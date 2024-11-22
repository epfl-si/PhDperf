import {Meteor} from "meteor/meteor";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat)

import {getUserPermittedTaskDetailed} from "/imports/policy/tasks";
import {getUserPermittedTasksForList} from "/imports/policy/tasksList/tasks";
import {isObsolete, Task} from "/imports/model/tasks";
import _ from "lodash";
import {
  canViewMentor,
  getUserPermittedTasksForDashboard,
  getUserPermittedTasksForDashboardOld,
} from "/imports/policy/dashboard/tasks";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {ActivityLogs} from "/imports/api/activityLogs/schema";
import {PhDInputVariables} from "/imports/model/tasksTypes";



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

      // activityLogs do not really need his own publish methods,
      // as the value changed when a task is created or removed anyway.
      const activityLogs = ActivityLogs.findOne({ _id: task.processInstanceKey }) ?? { logs: [] }
      Object.assign(task, { activityLogs: activityLogs.logs })

      task.variables = setFirstNameLastNameForDashboard(task.variables)
      task.variables = transformDateStringToDateObject(task.variables)

      this.added('tasks', id, task);
    },

    changed: (id, task) => {
      if (!canViewMentor(user, task) ) {  // not allowed to view the mentor ? let's clean all traces of it
        task = hideMentor( task );
      }

      const activityLogs = ActivityLogs.findOne({ _id: task.processInstanceKey }) ?? { logs: [] }
      Object.assign(task, { activityLogs: activityLogs.logs })

      task.variables = setFirstNameLastNameForDashboard(task.variables)
      task.variables = transformDateStringToDateObject(task.variables)

      this.changed('tasks', id, task);
    },

    removed: (id) => {
      this.removed('tasks', id)
    }

  })

  this.ready()

  if (handle) this.onStop(() => handle.stop());
})


/**
 * curate PhD Firstname Lastname, as our source was not able to
 * give us a clear answer at a certain point
 */
const setFirstNameLastNameForDashboard = (taskVariables: PhDInputVariables | undefined) => {
  if (!taskVariables) return

  const phdStudentDashboardName = {
    firstName: taskVariables.phdStudentName?.split(' ')[0],
    lastName: taskVariables.phdStudentName?.split(' ')[1]
  }

  // check if last operation was successful, or try a different approach
  if (
    (
      !phdStudentDashboardName.firstName ||
      !phdStudentDashboardName.lastName
    ) && taskVariables.phdStudentEmail
  ) {
    // can the email help us ?
    const firstLast = getFirstLastFromEmail(taskVariables.phdStudentEmail)

    phdStudentDashboardName.firstName= firstLast[0] ?? undefined
    phdStudentDashboardName.lastName = firstLast[1] ?? undefined
  }

  taskVariables.phdStudentFirstnameDashboard = phdStudentDashboardName.firstName
  taskVariables.phdStudentLastnameDashboard = phdStudentDashboardName.lastName

  return taskVariables
}

const getFirstLastFromEmail = (email: string) => {
  return email.split('@')[0].split('.').map(
    // capitalize the first char
    name => name.charAt(0).toUpperCase() + name.slice(1)
  )
}

/**
 * We may have some dates in a string format.
 * Clone them  in a date object column, so the sorting can be seamless
 */
const transformDateStringToDateObject = (taskVariables: PhDInputVariables | undefined) => {
  if (!taskVariables) return

  if (taskVariables.dueDate) {
    taskVariables.dueDateDashboard = dayjs(taskVariables.dueDate, 'DD.MM.YYYY').toDate()
  } else {
    // put the date far away if missing, so we can order it
    taskVariables.dueDateDashboard = new Date(1000, 12, 1)
  }
  return taskVariables
}
