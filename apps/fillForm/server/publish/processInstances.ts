import {Meteor} from "meteor/meteor";
import {getUserPermittedProcessInstanceEdit} from "/imports/policy/processInstance";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";


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
  if (!this.userId) return this.ready()
  const user: Meteor.User | null = Meteor.users.findOne({ _id: this.userId }) ?? null
  if (!user) return this.ready()

  return getUserPermittedProcessInstanceEdit(
    user,
    DoctoralSchools.find({}).fetch(),
    processInstanceKey
  )
})
