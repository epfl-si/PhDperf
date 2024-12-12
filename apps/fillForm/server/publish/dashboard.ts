import {Meteor} from "meteor/meteor";
import dayjs from "dayjs";
import _ from "lodash";

import {PhDInputVariables} from "/imports/model/tasksTypes";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {ActivityLogs} from "/imports/api/activityLogs/schema";
import {Task} from "/imports/model/tasks";
import {
  canViewMentor,
  getUserPermittedTasksForDashboard,
  getUserPermittedTasksForDashboardOld
} from "/imports/policy/dashboard/tasks";


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

      //task.variables = setFirstNameLastNameForDashboard(task.variables)
      task.variables = transformDateStringToDateObject(task.variables)

      this.added('tasks', id, task);
    },

    changed: (id, task) => {
      if (!canViewMentor(user, task) ) {  // not allowed to view the mentor ? let's clean all traces of it
        task = hideMentor( task );
      }

      const activityLogs = ActivityLogs.findOne({ _id: task.processInstanceKey }) ?? { logs: [] }
      Object.assign(task, { activityLogs: activityLogs.logs })

      //task.variables = setFirstNameLastNameForDashboard(task.variables)
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
  if (task.variables.mentorFirstNameUsage) task.variables.mentorFirstNameUsage = undefined
  if (task.variables.mentorLastNameUsage) task.variables.mentorLastNameUsage = undefined

  if (task.variables.mentorEmail) task.variables.mentorEmail = undefined

  return task
}
