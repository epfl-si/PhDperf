import {Mongo} from "meteor/mongo";
import {Meteor} from "meteor/meteor";
import persistentDB from "/imports/db/persistent";

export interface ReminderLog {
  elementId: string;  // which step this log concerns
  datetime: string;  // when the activity has been recorded
}

export interface RemindersLog {
  _id: string;  // the processInstanceKey
  logs: ReminderLog[];
}

class RemindersCollection extends Mongo.Collection<RemindersLog> {
}

export const ReminderLogs = new RemindersCollection('reminderLogs',
// @ts-ignore
  persistentDB && Meteor.isServer ? { _driver : persistentDB } : {})
