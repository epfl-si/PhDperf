import {Meteor} from "meteor/meteor";
import WorkersClient from "/server/zeebe_broker_connector";
import {PerfWorkflowTasks} from "/imports/ui/model/perf-workflow-tasks";

export const get_user_permitted_tasks = () => {
  if (Meteor.user()?.isAdmin) {
    return WorkersClient.find({})
  } else {

    const groups = Meteor.user()?.groupList

    return WorkersClient.find({
      $or: [
        {"customHeaders.allowedGroups": {$in: groups}},  // Get tasks for the group
        {"variables.assigneeSciper": Meteor.user()?._id}  // Get assigned tasks
      ]
    })
  }
}

export const is_allowed_to_submit = (taskKey: string) : boolean => {
  if (Meteor.user()?.isAdmin) {
    return true
  }

  return PerfWorkflowTasks.find({$and : [
      {
        "key": taskKey
      },
      {
        $or: [
          {"customHeaders.allowedGroups": {$in: Meteor.user()?.groupList}},
          {"variables.assigneeSciper": Meteor.user()?._id}
        ]
      }
    ]
    }).count() > 0
}
