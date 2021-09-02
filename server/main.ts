import {Meteor} from 'meteor/meteor'
import WorkersClient from './zeebe_broker_connector'
import Tequila from 'meteor/epfl:accounts-tequila'
import {encrypt} from './encryption'
import _ from 'lodash'
import findUp from 'find-up'
import '/imports/policy'
import {ZBClient} from "zeebe-node";
import {
  filter_unsubmittable_vars,
  get_user_permitted_tasks,
  is_allowed_to_submit
} from './permission/tasks'
//import {getUserInfoMemoized} from "/server/userFetcher";
import {
  FormioActivityLog,
  TaskData,
  //TaskParticipant,
  TasksCollection
} from "/imports/model/tasks";

const debug = require('debug')('server/main')
const tasks = TasksCollection<TaskData>()

require("dotenv").config({path: findUp.sync(".env")})

Meteor.startup(() => {
  WorkersClient.start()
  Tequila.start({
    getUserId: (tequila: any) => {
      return tequila.uniqueid;
    },
    request: ['uniqueid', 'username', 'name', 'firstname', 'displayname', 'personaltitle', 'email', 'group'],
    fakeLocalServer: Meteor.settings.fake_tequila,  // TODO: remove before prod, can be unwanted behavior
  })
})

Meteor.publish('tasks', function () {
  return get_user_permitted_tasks()
})

Meteor.methods({
  async startWorkflow() {  // aka start a new instance in Zeebe terms
    // TODO: check the right to start a workflow, into the "Start workflow button"?
    const diagramProcessId = 'phdAssessProcess'

    debug(`calling for a new "phdAssessProcess" instance`)

    const zbc = new ZBClient()

    try {
      const createProcessInstanceResponse = await Promise.resolve(zbc.createProcessInstance(diagramProcessId, {
        created_at: encrypt(new Date().toJSON()),
        created_by: encrypt(Meteor.userId()!),
        updated_at: encrypt(new Date().toJSON()),
      }))
      debug(`created new instance ${diagramProcessId}, response: ${JSON.stringify(createProcessInstanceResponse)}`)
      return createProcessInstanceResponse?.processKey
    } catch (e) {
      throw new Meteor.Error(500, `Unable to start a new workflow. Please contact the admin to verify the server. ${e}`)
    }
  },
  async submit(key, formData, formMetaData: FormioActivityLog) {
    if (!is_allowed_to_submit(key)) {
      debug(`Unallowed user is trying to sumbit the task ${key}`)
      throw new Meteor.Error(403, 'You are not allowed to submit this task')
    }

    const task:TaskData | undefined = tasks.findOne({ _id: key } )

    if (task) {
      formData = filter_unsubmittable_vars(
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
      throw new Meteor.Error(404, 'Error 404: Unknown task', 'Check the task exist by refreshing your browser')
    }
  },
})
