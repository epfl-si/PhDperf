import {Meteor} from "meteor/meteor";
import {get_user_permitted_tasks, get_user_permitted_tasks_dashboard} from "/imports/policy/tasks";

Meteor.publish('tasks', function () {
  return get_user_permitted_tasks()
})

Meteor.publish('tasksDashboard', function () {
  return get_user_permitted_tasks_dashboard()
})
