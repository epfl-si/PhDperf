// Define which tasks can be seen from the task list
import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {taskFieldsNeededForList, taskFieldsNeededForListAdmin} from "/imports/policy/tasksList/type";
import {filterOutObsoleteTasksQuery, filterOutSubmittedTasksQuery} from "/imports/policy/tasks";

export const getUserPermittedTasksForList = (user: Meteor.User | null) => {
  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return

  const taskQuery = {
    ...(!user.isAdmin && filterOutObsoleteTasksQuery()),
    ...(!user.isAdmin && { "variables.assigneeSciper": user._id }),
    ...filterOutSubmittedTasksQuery()
  }

  const taskFields = {
    ...( user.isAdmin ? taskFieldsNeededForListAdmin : taskFieldsNeededForList ),
  }

  return Tasks.find(taskQuery, { 'fields': taskFields })
}
