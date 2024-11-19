import {Meteor} from "meteor/meteor";
import {ActivityLogs} from "/imports/api/activityLogs/schema";


Meteor.publish('activityLogs', function() {
  let user: Meteor.User | null = null
  if (this.userId) {
    user = Meteor.users.findOne({_id: this.userId}) ?? null
  }

  if (user && ( user.isAdmin || user.isUberProgramAssistant )) {
    //TODO: could be better to fetch only the shown task, not all the Activity
    return ActivityLogs.find({})
  } else {
    this.ready()
  }
})
