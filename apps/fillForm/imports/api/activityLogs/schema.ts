import {Mongo} from "meteor/mongo";
import {Meteor} from "meteor/meteor";
import persistentDB from "/imports/db/persistent";


type ActivityLogEvent = 'started' | 'completed'

export interface ActivityLog {
  jobKey: string;
  elementId: string;  // which step this log concerns
  event: ActivityLogEvent;  // which event has been done
  datetime: string;  // when the activity has been recorded
}

export interface ActivityLogs {
  _id: string;  // the processInstanceKey
  logs: ActivityLog[];
}

class ActivityLogsCollection extends Mongo.Collection<ActivityLogs> {
}

export const ActivityLogs = new ActivityLogsCollection('activityLogs',
// @ts-ignore
  persistentDB && Meteor.isServer ? { _driver : persistentDB } : {})
