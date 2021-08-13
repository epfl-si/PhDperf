import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import {TaskData} from "/imports/ui/model/tasks";

// Due to restrictions in the Meteor model, this function can only be
// called once per locus (i.e. once in the client and once in the
// server).
export function TasksCollection<U>(transform ?: (doc: TaskData) => U) {
    const collectionName = 'tasks'

  return new Mongo.Collection<TaskData, U>(
    collectionName,
    // The collection is *not* persistent server-side; instead, it gets fed from Zeebe
    Meteor.isServer ? { connection : null, transform } : { transform })
}
