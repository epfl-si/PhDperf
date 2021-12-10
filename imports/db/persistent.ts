// This one should be backuped and resilient, not like the default one
let persistentDB: Object | null = null

// on dev, use the same db for all the collections
// on prod. use the persisting one
if (!Meteor.isDevelopment) {
  if (!process.env.MONGO_PERSISTENT_URL) {
    throw new Meteor.Error('Missing var env for connecting to the persistent db. Failing.')
  } else {
    persistentDB = DDP.connect(process.env.MONGO_PERSISTENT_URL);
  }
}

export default persistentDB
