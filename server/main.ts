import { Meteor } from 'meteor/meteor'
import { WorkflowClient } from './workflow'
import Tequila from 'meteor/epfl:accounts-tequila'
import { Encryption } from '/server/encryption'
import findUp from 'find-up'
import '/imports/policy'

import debug_ from 'debug'
const debug = debug_('server/main')

require("dotenv").config({path: findUp.sync(".env")})

Meteor.startup(() => {
  WorkflowClient.the().start()
  Tequila.start()
})

Meteor.publish('tasks', function() {
  return WorkflowClient.the().find({})
})

const encryptionKey = process.env.PHDASSESS_ENCRYPTION_KEY as string

Meteor.methods({
  submit(key, data, metadata) {
    const encryption = new Encryption(encryptionKey, key)
    WorkflowClient.the().api(key).success({
      encryptedData: encryption.encrypt(data),
      encryptedMetadata: encryption.encrypt(metadata)
    })
  }
})
