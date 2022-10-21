// Define which tasks can be seen from the task list
import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {taskFieldsNeededForList, taskFieldsNeededForListAdmin} from "/imports/policy/tasksList/type";

export const getUserPermittedTasksForList = () => {
  const getTasksQuery = (user: Meteor.User) => {
    if (user.isAdmin) {
      return {}
    } else {
      return {"variables.assigneeSciper": user._id }
    }
  }

  const getTasksFields = (user: Meteor.User) => {
    if (user.isAdmin) {
      return taskFieldsNeededForListAdmin
    } else {
      return taskFieldsNeededForList
    }
  }

  // at this point, check the user is goodly instanced, or return nothing
  const user = Meteor.user()
  if (!user) return
  const taskQuery = getTasksQuery(user)

  return Tasks.find(taskQuery, { 'fields': getTasksFields(user) })
}
