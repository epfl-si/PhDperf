import crypto from "node:crypto";
import {Meteor} from "meteor/meteor";

import {encrypt} from "/server/encryption";
import {Tasks, UnfinishedTasks} from "/imports/model/tasks";
import {
  canDeleteProcessInstance,
  canStartProcessInstance, canRefreshProcessInstance,
} from "/imports/policy/tasks";
import {zBClient} from "/server/zeebe_broker_connector";
import {auditLogConsoleOut} from "/imports/lib/logging";

// load methods from shared js
import '/imports/api/doctoralSchools/methods'
import '/server/methods/ImportScipers'
import '/server/methods/DoctoralSchools'
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";

const auditLog = auditLogConsoleOut.extend('server/methods')


Meteor.methods({

  async startWorkflow() {  // aka start a new instance in Zeebe terms
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canStartProcessInstance(user, DoctoralSchools.find({}).fetch())) {
      auditLog(`Unallowed user ${user._id} is trying to start a workflow.`)
      throw new Meteor.Error(403, 'You are not allowed to start a workflow')
    }

    const diagramProcessId = 'phdAssessProcess'

    auditLog(`calling for a new "phdAssessProcess" instance`)

    if(!zBClient) throw new Meteor.Error(500, `The Zeebe client has not been able to start on the server.`)

    try {
      const createProcessInstanceResponse = await Promise.resolve(zBClient.createProcessInstance(diagramProcessId, {
        created_at: encrypt(new Date().toJSON()),
        created_by: encrypt(user._id),
        updated_at: encrypt(new Date().toJSON()),
        assigneeSciper: encrypt(user._id),
        uuid: crypto.randomUUID(),
      }))
      auditLog(`created new instance ${diagramProcessId}, response: ${JSON.stringify(createProcessInstanceResponse)}`)
      return createProcessInstanceResponse?.processInstanceKey
    } catch (e) {
      auditLog(`Error: Unable to create a new workflow instance. ${e}`)
      throw new Meteor.Error(500, `Unable to start a new workflow. Please contact the admin to verify the server. ${e}`)
    }
  },

  async deleteProcessInstance(processInstanceKey) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canDeleteProcessInstance(user)) {
      auditLog(`Unallowed user to delete the process instance key ${processInstanceKey}`)
      throw new Meteor.Error(403, 'You are not allowed to delete a process instance')
    }

    if(!zBClient) throw new Meteor.Error(500, `The Zeebe client has not been able to start on the server.`)

    try {
      await zBClient.cancelProcessInstance(processInstanceKey)

      // get linked tasks
      const tasksToRemove = Tasks.find(
        { processInstanceKey: processInstanceKey },
        { fields: { _id: 1 } }
      ).fetch()

      for (const task of tasksToRemove) {
        // delete in db too
        await Tasks.removeAsync( { processInstanceKey: processInstanceKey })
        await UnfinishedTasks.removeAsync({ taskId: task._id!})
      }

      auditLog(`Sucessfully deleted a process instance ${processInstanceKey}`)
    } catch (error) {
      auditLog(`Error: Unable to cancel the process instance ${processInstanceKey}. ${error}`)
      Tasks.remove({processInstanceKey: processInstanceKey})
      throw new Meteor.Error(500, `Unable to cancel the task. ${error}. Deleting locally anyway`)
    }
  },

  async refreshProcessInstance(processInstanceKey) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canRefreshProcessInstance(user)) {
      auditLog(`Unallowed user ${user._id} is trying to refresh the process instance key ${processInstanceKey}.`)
      throw new Meteor.Error(403, 'You are not allowed to refresh a process instance')
    }

    auditLog(`Refreshing a process instance ${processInstanceKey} by removing it from Meteor`)
    Tasks.remove({processInstanceKey: processInstanceKey})
  },
})
