import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { WorkflowClient } from './workflow'

require("dotenv").config()

Meteor.startup(() => {
  WorkflowClient.the().start()
})

Meteor.publish('tasks', function() {
  return WorkflowClient.the().find({})
})
