import {Meteor} from 'meteor/meteor'
import {findUpSync} from 'find-up'
import { PrometheusSource } from '/server/prometheus'

import Tequila from 'meteor/epfl:accounts-tequila'

import './zeebe'
import './fixtures/doctoralSchools'
import './methods'
import './publish'
import '/imports/policy'

import ZeebeClient from './zeebe/connector'

require("dotenv").config({path: findUpSync(".env")})


Meteor.startup(() => {

  // add custom methods for the devs
  if (Meteor.isDevelopment) {
    import('./methods/Fixtures');
  }

  ZeebeClient.start()

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
