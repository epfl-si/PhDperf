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
import {auditLogConsoleOut} from "/imports/lib/logging";

// load methods from shared js
import '/imports/api/doctoralSchools/methods'
import '/server/methods/ImportScipers'

const tasks = TasksCollection<TaskData>()
const auditLog = auditLogConsoleOut.extend('server/methods')


Meteor.methods({

  async startWorkflow() {  // aka start a new instance in Zeebe terms
    if (!canStartProcessInstance()) {
      auditLog(`Unallowed user ${Meteor.user()?._id} is trying to start a workflow. The error has been thrown to user.`)
      throw new Meteor.Error(403, 'You are not allowed to start a workflow')
    }

    const diagramProcessId = 'phdAssessProcess'

    auditLog(`calling for a new "phdAssessProcess" instance`)

    if(!zBClient) throw new Meteor.Error(500, `The Zeebe client has not been able to start on the server.`)

    try {
      const createProcessInstanceResponse = await Promise.resolve(zBClient.createProcessInstance(diagramProcessId, {
        created_at: encrypt(new Date().toJSON()),
        created_by: encrypt(Meteor.userId()!),
        updated_at: encrypt(new Date().toJSON()),
        assigneeSciper: encrypt(Meteor.user()!._id),
      }))
      auditLog(`created new instance ${diagramProcessId}, response: ${JSON.stringify(createProcessInstanceResponse)}`)
      return createProcessInstanceResponse?.processKey
    } catch (e) {
      auditLog(`Error creating a new workflow. The error has been thrown to user.`)
      throw new Meteor.Error(500, `Unable to start a new workflow. Please contact the admin to verify the server. ${e}`)
    }
  },

  async submit(key, formData, formMetaData: FormioActivityLog) {
    if (!canSubmit(key)) {
      auditLog(`Unallowed user ${Meteor.user()?._id} is trying to sumbit the task ${key}`)
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
        auditLog(`Error because a form as insufficient data. The error has been thrown to user.`)
        throw new Meteor.Error(400, 'There is not enough valid data to validate this form. Canceling.')
      }

      // update Users info, based on sciper, if possible. Block only if we don't have any data on the PhD
      try {
        formData = await updateParticipantsFromSciper(formData)
      } catch (e: any) {
        if (e.name == 'AbortError') {
          // Look like the fetching of user info has got a timeout,
          // make it bad only if we don't have already some data, or ignore it
          auditLog(`Time out Error in fetching scipers. The error has been thrown to user.`)
          if (!task.variables.phdStudentEmail) throw new Meteor.Error(422,'Unable to get users information, aborting. Please contact the administrator or try again later.')
        } else {
          auditLog(`Error in parsing a participant ${e}. The error has been thrown to user.`)
          throw new Meteor.Error(422, `There is a problem with a participant: ${e}`)
        }
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
      auditLog(`Successfully submitted form for task id ${task._id}.`)
    } else {
      auditLog("Error the task being submitted can not be found. Task id : ${task._id}. The error has been thrown to user.")
      throw new Meteor.Error(404, 'Unknown task', 'Check the task exist by refreshing your browser')
    }
  },

  async deleteProcessInstance(processInstanceKey) {
    if (!canDeleteProcessInstance()) {
      auditLog(`Unallowed user to delete the process instance key ${processInstanceKey}`)
      throw new Meteor.Error(403, 'You are not allowed to delete a process instance')
    }

    if(!zBClient) throw new Meteor.Error(500, `The Zeebe client has not been able to start on the server.`)

    try {
      await zBClient.cancelProcessInstance(processInstanceKey)
      // delete in db too
      tasks.remove({processInstanceKey: processInstanceKey})
      auditLog(`Sucessfully deleted a process instance ${processInstanceKey}`)
    } catch (error) {
      auditLog(`Error: Unable to cancel the process instance ${processInstanceKey}. ${error}`)
      tasks.remove({processInstanceKey: processInstanceKey})
      throw new Meteor.Error(500, `Unable to cancel the task. ${error}. Deleting locally anyway`)
    }
  },

  async refreshProcessInstance(processInstanceKey) {
    if (!canRefreshProcessInstance()) {
      auditLog(`Unallowed user to refresh the process instance key ${processInstanceKey}. The error has been thrown to user.`)
      throw new Meteor.Error(403, 'You are not allowed to refresh a process instance')
    }

    auditLog(`Refreshing a process instance ${processInstanceKey} by removing it from Meteor`)
    tasks.remove({processInstanceKey: processInstanceKey})
  },
})
