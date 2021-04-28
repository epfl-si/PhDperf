import {Meteor} from 'meteor/meteor'
import WorkersClient from './workflow'
import Tequila from 'meteor/epfl:accounts-tequila'
import {Encryption} from '/server/encryption'
import _ from 'lodash'
import findUp from 'find-up'
import '/imports/policy'
import {ZBClient} from "zeebe-node";

const debug = require('debug')('server/main')

require("dotenv").config({path: findUp.sync(".env")})

Meteor.startup(() => {
  WorkersClient.start()
  Tequila.start()
})

Meteor.publish('tasks', function () {
  return WorkersClient.find({})
})

const encryptionKey = process.env.PHDASSESS_ENCRYPTION_KEY as string

Meteor.methods({
  'launch_workflow' () {  // aka start a new instance in Zeebe terms
    const diagramProcessId = 'Process_PhDAssess'

    debug(`calling for a new "Process_PhDAssess" instance`)
    const zbc = new ZBClient()
    zbc.createWorkflowInstance(diagramProcessId, {}).then(
      (res) => {
        debug(`created new instance ${diagramProcessId}, response: ${res}`)
      })
  },
  submit(key, data, metadata) {
    delete data['submit']  // no thanks, I already know that

    const encryption = new Encryption(encryptionKey, key)
    data = _.mapValues(data, x => encryption.encrypt(x))  // encrypt all data

    data['metadata'] = encryption.encrypt(metadata)  // add some info on the submitter

    WorkersClient.success(key, data)
    debug("Submitted form result")
  },
})
