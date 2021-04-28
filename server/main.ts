import { Meteor } from 'meteor/meteor'
import WorkersClient from './workflow'
import Tequila from 'meteor/epfl:accounts-tequila'
import { Encryption } from '/server/encryption'
import findUp from 'find-up'
import '/imports/policy'

import debug_ from 'debug'
const debug = debug_('server/main')

require("dotenv").config({path: findUp.sync(".env")})

Meteor.startup(() => {
  WorkersClient.start()
  Tequila.start()
})

/*
// Start an instance every time a client connect
Meteor.onConnection(async (connection) => {
  console.debug(`starting workflow instance "Process_PhDAssess" for ${connection}`);
  const zbc = new ZBClient();
  const res = await zbc.createWorkflowInstance("Process_PhDAssess", {});
  console.debug(res);
});
*/

Meteor.publish('tasks', function() {
  return WorkersClient.find({})
})

const encryptionKey = process.env.PHDASSESS_ENCRYPTION_KEY as string

Meteor.methods({
  submit(key, data, metadata) {
    const encryption = new Encryption(encryptionKey, key)
    const workerResult = {
      sciper_list: Object.keys(data['sciper_list']).map(x => encryption.encrypt(x)),
      metadata: encryption.encrypt(metadata)
    };

    WorkersClient.success(key, workerResult)
    console.debug("Submitted form result")
  }
})
