import {Meteor} from "meteor/meteor";
import {getUserPermittedProcessInstanceEdit} from "/imports/policy/processInstance";


/**
 * Used when we want to edit zeebe process instance data.
 * As the app focus on task and not on processInstance, it is tricky to simulate
 * this process instance view without some refactorings. So for the time being,
 * we fetch all tasks for this process instance, and we work on it that way.
 *
 * @param: args - The process Instance key we want to edit
 * @returns a pointer to the list of tasks for this
 *          processInstance that the user can edit.
 *
 */
Meteor.publish('processInstanceEdit', function (processInstanceKey: string) {
  if (this.userId) {
    const user: Meteor.User | null = Meteor.users.findOne({ _id: this.userId }) ?? null
    return getUserPermittedProcessInstanceEdit(user, processInstanceKey)
  } else {
    this.ready()
  }
})
