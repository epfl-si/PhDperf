import {Meteor} from "meteor/meteor";
import {encrypt} from "/server/encryption";
import {FormioActivityLog, TaskData, TasksCollection} from "/imports/model/tasks";
import {
  filterUnsubmittableVars, canSubmit, canDeleteProcessInstance,
  canStartProcessInstance, canRefreshProcessInstance
} from "/imports/policy/tasks";
import _ from "lodash";
import {zBClient} from "/server/zeebe_broker_connector";
import WorkersClient from './zeebe_broker_connector'
import {updateParticipantsFromSciper} from "/server/userFetcher";


const tasks = TasksCollection<TaskData>()
const debug = require('debug')('server/methods')

Meteor.methods({

  async startWorkflow() {  // aka start a new instance in Zeebe terms
    if (!canStartProcessInstance()) {
      debug(`Unallowed user ${Meteor.user()?._id} is trying to start a workflow`)
      throw new Meteor.Error(403, 'You are not allowed to start a workflow')
    }

    const diagramProcessId = 'phdAssessProcess'

    debug(`calling for a new "phdAssessProcess" instance`)

    if(!zBClient) throw new Meteor.Error(500, `The Zeebe client has not been able to start on the server.`)

    try {
      const createProcessInstanceResponse = await Promise.resolve(zBClient.createProcessInstance(diagramProcessId, {
        created_at: encrypt(new Date().toJSON()),
        created_by: encrypt(Meteor.userId()!),
        updated_at: encrypt(new Date().toJSON()),
        assigneeSciper: encrypt(Meteor.user()!._id),
      }))
      debug(`created new instance ${diagramProcessId}, response: ${JSON.stringify(createProcessInstanceResponse)}`)
      return createProcessInstanceResponse?.processKey
    } catch (e) {
      throw new Meteor.Error(500, `Unable to start a new workflow. Please contact the admin to verify the server. ${e}`)
    }
  },

  async submit(key, formData, formMetaData: FormioActivityLog) {
    if (!canSubmit(key)) {
      debug(`Unallowed user is trying to sumbit the task ${key}`)
      throw new Meteor.Error(403, 'You are not allowed to submit this task')
    }

    const task:TaskData | undefined = tasks.findOne({ _id: key } )

    if (task) {
      formData = filterUnsubmittableVars(
        formData,
        task.customHeaders.formIO,
        ['cancel', 'submit'],
        [
          'created_at',
          'created_by',
        ]
      )

      if (formData.length == 0) {
        throw new Meteor.Error(400, 'There is not enough valid data to validate this form. Canceling.')
      }

      // update Users info, based on sciper
      try {
        formData = await updateParticipantsFromSciper(formData)
      } catch (e) {
        throw new Meteor.Error(400, `There is a problem with a participant: ${e}`)
      }

      formData.updated_at = new Date().toJSON()

      formData = _.mapValues(formData, x => encrypt(x))  // encrypt all data

      // append activity over other activities
      let activitiesLog: FormioActivityLog[] = []
      if (task.variables.activityLogs) {
        activitiesLog = JSON.parse(task.variables.activityLogs)
        activitiesLog.push(formMetaData)
      }
      formData.activityLogs = encrypt(JSON.stringify(activitiesLog))

      await WorkersClient.success(task._id, formData)
      tasks.remove({_id: task._id})
      debug("Submitted form result")
    } else {
      debug("Error can not find the task that is trying to be submitted")
      throw new Meteor.Error(404, 'Unknown task', 'Check the task exist by refreshing your browser')
    }
  },

  async deleteProcessInstance(processInstanceKey) {
    if (!canDeleteProcessInstance()) {
      debug(`Unallowed user to delete the process instance key ${processInstanceKey}`)
      throw new Meteor.Error(403, 'You are not allowed to delete a process instance')
    }

    debug(`Asking to delete an process instance ${processInstanceKey}`)

    if(!zBClient) throw new Meteor.Error(500, `The Zeebe client has not been able to start on the server.`)

    try {
      await zBClient.cancelProcessInstance(processInstanceKey)
      // delete in db too
      tasks.remove({processInstanceKey: processInstanceKey})
    } catch (error) {
      debug(`Error: Unable to cancel the process instance ${processInstanceKey}. ${error}`)
      tasks.remove({processInstanceKey: processInstanceKey})
      throw new Meteor.Error(500, `Unable to cancel the task. ${error}. Deleting locally anyway`)
    }
  },

  async refreshProcessInstance(processInstanceKey) {
    if (!canRefreshProcessInstance()) {
      debug(`Unallowed user to refresh the process instance key ${processInstanceKey}`)
      throw new Meteor.Error(403, 'You are not allowed to refresh a process instance')
    }

    debug(`Asking to refresh an process instance ${processInstanceKey}`)
    tasks.remove({processInstanceKey: processInstanceKey})
  },
})
