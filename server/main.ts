import { Meteor } from 'meteor/meteor'
import { WorkflowClient } from './workflow'
import Tequila from 'meteor/epfl:accounts-tequila'
import findUp from 'find-up'
import '/imports/policy'

require("dotenv").config({path: findUp.sync(".env")})

Meteor.startup(() => {
  WorkflowClient.the().start()
  Tequila.start()
})

Meteor.publish('tasks', function() {
  return WorkflowClient.the().find({})
})
