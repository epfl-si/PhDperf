import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { WorkflowClient } from './workflow'
import Tequila from 'meteor/epfl:accounts-tequila'

require("dotenv").config()

Meteor.startup(() => {
  WorkflowClient.the().start()
  Tequila.start()
})

Meteor.publish('tasks', function() {
  return WorkflowClient.the().find({})
})
