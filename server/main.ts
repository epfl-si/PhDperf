import {Meteor} from 'meteor/meteor'
import './fixtures/doctoralSchools'
import './methods'
import './publish'
import WorkersClient from './zeebe_broker_connector'
import { PrometheusSource } from '/server/prometheus'
import Tequila from 'meteor/epfl:accounts-tequila'
import {findUpSync} from 'find-up'
import '/imports/policy'

require("dotenv").config({path: findUpSync(".env")})


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
    bypass: Tequila.defaultOptions.bypass.concat("/metrics")
  })
  PrometheusSource.start()
})
