import {Meteor} from 'meteor/meteor'
import WorkersClient from './zeebe_broker_connector'
import Tequila from 'meteor/epfl:accounts-tequila'
import {encrypt} from './encryption'
import _ from 'lodash'
import findUp from 'find-up'
import '/imports/policy'
import {ZBClient} from "zeebe-node";
import {get_user_permitted_tasks,
  is_allowed_to_submit} from './permission/tasks'

const debug = require('debug')('server/main')

require("dotenv").config({path: findUp.sync(".env")})

Meteor.startup(() => {
  WorkersClient.start()
  Tequila.start({
    getUserId: (tequila: any) => {
      return tequila.uniqueid;
    },
    request: ['uniqueid', 'username', 'name', 'firstname', 'displayname', 'personaltitle', 'email', 'group'],
    fakeLocalServer: Meteor.settings.fake_tequila,  // TODO: remove before prod, can be unwanted behavior
  })
})

Meteor.publish('tasks', function () {
  return get_user_permitted_tasks()
})

Meteor.methods({
  async start_workflow() {  // aka start a new instance in Zeebe terms
    // TODO: check the right to start a workflow, into the "Start workflow button"?
    const diagramProcessId = 'phdAssessProcess'

    debug(`calling for a new "phdAssessProcess" instance`)
    const zbc = new ZBClient()
    await zbc.createProcessInstance(diagramProcessId, {}).then(
      (res) => {
        debug(`created new instance ${diagramProcessId}, response: ${JSON.stringify(res)}`)
      })
  },
  async submit(key, data, metadata) {
    if (!is_allowed_to_submit(key)) {
      throw new Meteor.Error(403, 'Error 403: Not allowed', 'Check your permission');
    }

    delete data['submit']  // no thanks, I already know that
    delete data['cancel']  // no thanks, I already know that

    data = _.mapValues(data, x => encrypt(x))  // encrypt all data
    // TODO: should be an append to an existing array
    data['activityLogs'] = encrypt(JSON.stringify(metadata))  // add some info on the submitter

    await WorkersClient.success(key, data)
    debug("Submitted form result")
  },
})
