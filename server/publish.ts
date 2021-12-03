import {Meteor} from "meteor/meteor";
import {DoctoralSchools} from "/imports/api/doctoralSchools";
import {get_user_permitted_tasks, get_user_permitted_tasks_dashboard} from "/imports/policy/tasks";

Meteor.publish('tasks', function () {
  return get_user_permitted_tasks()
})

Meteor.publish('tasksDashboard', function () {
  return get_user_permitted_tasks_dashboard()
})

Meteor.publish('doctoralSchools', function() {
  if (Meteor.user()?.isAdmin) {
    return DoctoralSchools.find()
  } else {
    return this.ready()
  }
})
