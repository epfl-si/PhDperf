import {Meteor} from "meteor/meteor";
import {getRemindersForDashboardTasks, getUserPermittedTaskReminder} from "/imports/policy/reminders";


Meteor.publish('taskReminder', function (taskId: [string]) {
  if (this.userId) {
    const user = Meteor.users.findOne({ _id: this.userId }) ?? null
    return getUserPermittedTaskReminder(user, taskId[0])
  } else {
    this.ready()
  }
})

Meteor.publish('remindersForDashboardTasks', function () {
  if (this.userId) {
    const user = Meteor.users.findOne({ _id: this.userId }) ?? null
    return getRemindersForDashboardTasks(user)
  } else {
    this.ready()
  }
})
