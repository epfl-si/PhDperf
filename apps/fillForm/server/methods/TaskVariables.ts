import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import WorkersClient from "/server/zeebe_broker_connector";
import {_PhDAssessVariables} from "phd-assess-meta/types/variables";
import {encrypt} from "/server/encryption";
import {canEditProcessInstanceVariables} from "/imports/policy/processInstance";


Meteor.methods({

  async updateZeebeInstanceVariables( { processInstanceKey, newVariables }) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return
    if (!canEditProcessInstanceVariables(user)) throw new Meteor.Error(
      403,
      'You are not allowed to change the process instance variables',
    )

    const tasks = await Tasks.find({processInstanceKey: processInstanceKey}).fetchAsync()

    if (!tasks || tasks.length == 0) throw new Meteor.Error(
      404,
      `This task does not exist or you don't have the permission to edit.`,
    )

    const encryptedVariables = Object.fromEntries(
      Object.entries(newVariables).map( ( [key, value ] ) => [key, encrypt(value as string) ])
    )

    for (let task of tasks) {
      await WorkersClient.setVariables(
        task.elementInstanceKey,
        encryptedVariables,
        false
      )

      // update the task variables in mongo too
      await Tasks.updateAsync(
        { _id: task._id },
        { $set: { variables: {...task.variables, ...newVariables } } }
      )
    }
  },
})
