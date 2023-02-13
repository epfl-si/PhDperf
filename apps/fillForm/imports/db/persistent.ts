import { MongoInternals } from 'meteor/mongo';


// This one should be backuped and resilient, not like the default one
let persistentDB: Object | null = null

if (Meteor.isServer) {
  // on dev, use the same db for all the collections
  // on prod. use the persisting one
  if (!Meteor.isDevelopment) {
    if (!process.env.MONGO_PERSISTENT_URL) {
      throw new Meteor.Error('Missing var env for connecting to the persistent db. Failing.')
    } else {
      // @ts-ignore
      persistentDB = new MongoInternals.RemoteCollectionDriver(process.env.MONGO_PERSISTENT_URL);
    }
  }
}

export default persistentDB
