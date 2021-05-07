import {Meteor} from 'meteor/meteor'
import WorkersClient from './workflow'
import Tequila from 'meteor/epfl:accounts-tequila'
import {encrypt} from '/server/encryption'
import _ from 'lodash'
import findUp from 'find-up'
import '/imports/policy'
import {ZBClient} from "zeebe-node";

const debug = require('debug')('server/main')

require("dotenv").config({path: findUp.sync(".env")})

Meteor.startup(() => {
  WorkersClient.start()
  Tequila.start({
    getUserId: (tequila: any) => {
      return tequila.uniqueid;
    },
    request: ['uniqueid', 'username', 'name', 'firstname', 'displayname', 'personaltitle', 'email', 'group'],
  })
})

Meteor.publish('tasks', function () {
  const currentUserGroups = Meteor.user()?.tequila?.group
  if (!currentUserGroups || currentUserGroups.length == 0) {
    return this.ready();
  }

  const currentUserGroupsArray = currentUserGroups.split(',')

  // TODO: move this permission rule into an auditable file .ts, like a
  return WorkersClient.find({
    $or: [
      {"customHeaders.allowed_groups": {$in: currentUserGroupsArray}},
      {"variables.assigneeSciper": Meteor.user()?._id}
    ]
  })
})

Meteor.methods({
  'launch_workflow'() {  // aka start a new instance in Zeebe terms
    const diagramProcessId = 'Process_PhDAssess'

    debug(`calling for a new "Process_PhDAssess" instance`)
    const zbc = new ZBClient()
    zbc.createWorkflowInstance(diagramProcessId, {}).then(
      (res) => {
        debug(`created new instance ${diagramProcessId}, response: ${JSON.stringify(res)}`)
      })
  },
  submit(key, data, metadata) {
    delete data['submit']  // no thanks, I already know that
    delete data['cancel']  // no thanks, I already know that

    data = _.mapValues(data, x => encrypt(x))  // encrypt all data
    data['metadata'] = encrypt(JSON.stringify(metadata))  // add some info on the submitter

    WorkersClient.success(key, data)
    debug("Submitted form result")
  },
})
