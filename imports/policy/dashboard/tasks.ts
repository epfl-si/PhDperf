import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import {getAssistantAdministrativeMemberships} from "/imports/policy/tasks";
import {taskFieldsNeededForDashboard} from "/imports/policy/dashboard/type";

// Define which tasks can be seen from the dashboard
export const getUserPermittedTasksForDashboard = (doctoralSchools : DoctoralSchool[]) => {

  const getTasksQueryForDashboard = (user: Meteor.User) => {

    if (user.isAdmin) {
      return {}  // get all if admin
    } else {
      return {
        '$or' : [
          { "variables.assigneeSciper": user._id },  // Get assigned tasks
          { "variables.phdStudentSciper": user._id },
          { "variables.programAssistantSciper": user._id },  // Get tasks that we started as programAssistant
          { "variables.doctoralProgramName": { $in: Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools)) } },  // Get tasks for the group
        ]
      }
    }
  }

  const user = Meteor.user()

  // at this point, check the user is goodly instanced, or return nothing
  if (!user) return
  const taskQuery = getTasksQueryForDashboard(user)  //get only the task needed

  return Tasks.find(taskQuery, { 'fields': taskFieldsNeededForDashboard })
}
