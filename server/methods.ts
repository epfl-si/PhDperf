import {Meteor} from "meteor/meteor";
import {encrypt} from "/server/encryption";
import {Tasks} from "/imports/model/tasks";
import {FormioActivityLog} from "/imports/model/tasksTypes";
import {
  filterUnsubmittableVars, canSubmit, canDeleteProcessInstance,
  canStartProcessInstance, canRefreshProcessInstance,
  getUserPermittedTaskDetailed
} from "/imports/policy/tasks";
import _ from "lodash";
import {zBClient} from "/server/zeebe_broker_connector";
import WorkersClient from './zeebe_broker_connector'
import {getParticipantsToUpdateFromSciper} from "/server/userFetcher";
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
      }))
      auditLog(`created new instance ${diagramProcessId}, response: ${JSON.stringify(createProcessInstanceResponse)}`)
      return createProcessInstanceResponse?.processKey
    } catch (e) {
      auditLog(`Error: Unable to create a new workflow instance. ${e}`)
      throw new Meteor.Error(500, `Unable to start a new workflow. Please contact the admin to verify the server. ${e}`)
    }
  },

  async getTaskForm(_id) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    const task = getUserPermittedTaskDetailed(user, _id)?.fetch()

    if (task && task[0]) {
      return task[0]
    } else {
      auditLog(`Error: the task that is trying to be edited can not be found or the user has no the correct rights. Task key requested: ${_id}.`)
      throw new Meteor.Error(404, 'Unknown task or unallowed permission', 'Check the task exist by refreshing your browser')
    }
  },

  async submit(_id, formData, formMetaData: FormioActivityLog) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canSubmit(user, _id)) {
      auditLog(`Unallowed user ${user._id} is trying to submit the task ${_id}`)
      throw new Meteor.Error(403, 'You are not allowed to submit this task')
    }

    const task = Tasks.findOne({ _id: _id } )

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
        auditLog(`Error: the form being submitted by ${user._id} as insufficient data.`)
        throw new Meteor.Error(400, 'There is not enough valid data to validate this form. Canceling.')
      }

      // update Users info, based on sciper, if possible. Block only if we don't have any data on the PhD
      try {
        let participantsToUpdate: any
        if (!task.variables.phdStudentSciper) {
          // look like a first step if we do not have the phdStudentSciper in task.variables.
          // let's fetch with formData then
          participantsToUpdate = await getParticipantsToUpdateFromSciper(formData)
        } else {
          participantsToUpdate = await getParticipantsToUpdateFromSciper(task.variables)
        }

        formData = {...formData, ...participantsToUpdate}
      } catch (e: any) {
        if (e.name == 'AbortError') {
          // Look like the fetching of user info has got a timeout,
          // make it bad only if we don't have already some data, or ignore it
          auditLog(`Error: Timeout while fetching scipers.`)
          if (!task.variables.phdStudentEmail) throw new Meteor.Error(422,'Unable to get users information, aborting. Please contact the administrator or try again later.')
        } else {
          auditLog(`Error: parsing a participant ${e} has failed. Aborting.`)
          throw new Meteor.Error(422, `There is a problem with a participant: ${e}`)
        }
      }

      formData.updated_at = new Date().toJSON()

      formData = _.mapValues(formData, x => encrypt(x))  // encrypt all data

      // append the current activity over other activities
      // but only keep the pathName of the current task, as it inform about the jobId
      const jobURLs = []

      if (task.variables.activityLogs) {  // do we have already some activities logged ?
        let activitiesLogs: FormioActivityLog[] = JSON.parse(task.variables.activityLogs)
        // cleanup other data that were put inside in old code, only keep pathName
        for (let activitiesLog of activitiesLogs) {
          jobURLs.push(_.pick(activitiesLog, 'pathName'))
        }
      }

      jobURLs.push(_.pick(formMetaData, 'pathName' ))  // push the actual one

      formData.activityLogs = encrypt(JSON.stringify(jobURLs))

      auditLog(`Sending success: job ${task._id} of process instance ${task.processInstanceKey} with data ${JSON.stringify(formData)}`)
      await WorkersClient.success(task._id!, formData)
      Tasks.markAsSubmitted(task._id!)
      auditLog(`Successfully submitted form for task id ${task._id}.`)
    } else {
      auditLog(`Error: the task that is being submitted can not be found. Task key requested: ${_id}.`)
      throw new Meteor.Error(404, 'Unknown task', 'The task does not exist anymore.')
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
      // delete in db too
      Tasks.remove({processInstanceKey: processInstanceKey})
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
