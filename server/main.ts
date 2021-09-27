import {Meteor} from 'meteor/meteor'
import './methods'
import WorkersClient from './zeebe_broker_connector'
import Tequila from 'meteor/epfl:accounts-tequila'
import findUp from 'find-up'
import '/imports/policy'
import { get_user_permitted_tasks } from '/imports/policy/tasks'
import { LoggerAdaptToConsole } from "console-log-json";

require("dotenv").config({path: findUp.sync(".env")})

// Start logging as JSON if we are not in debug mode
if (!process.env.DEBUG?.search('/\*/')) {
  LoggerAdaptToConsole()
}

Meteor.startup(() => {
  WorkersClient.start()
  Tequila.start({
    getUserId: (tequila: any) => {
      return tequila.uniqueid;
    },
    service: 'PhD Annual Report',
    allows: 'categorie=epfl-guests',
    request: ['uniqueid', 'username', 'name', 'firstname', 'displayname', 'personaltitle', 'email', 'group'],
    fakeLocalServer: Meteor.settings.fake_tequila,  // TODO: remove before prod, can be unwanted behavior
  })
})

Meteor.publish('tasks', function () {
  return get_user_permitted_tasks()
})
