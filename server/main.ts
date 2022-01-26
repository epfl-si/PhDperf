import {Meteor} from 'meteor/meteor'
import './fixtures/doctoralSchools'
import './methods'
import './publish'
import WorkersClient from './zeebe_broker_connector'
import Tequila from 'meteor/epfl:accounts-tequila'
import findUp from 'find-up'
import '/imports/policy'
import {observeTasksForImportScipers} from "/server/observers/TasksForImportScipers";

require("dotenv").config({path: findUp.sync(".env")})


Meteor.startup(() => {
  WorkersClient.start()
  Tequila.start({
    getUserId: (tequila: any) => {
      return tequila.uniqueid;
    },
    service: 'PhD Annual Report',
    allows: 'categorie=epfl-guests',
    request: ['uniqueid', 'username', 'name', 'firstname', 'displayname', 'personaltitle', 'email', 'group'],
    fakeLocalServer: Meteor.settings.fake_tequila,
  })
  observeTasksForImportScipers()
})

