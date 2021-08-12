import {Meteor} from 'meteor/meteor'
import WorkersClient from './zeebe_broker_connector'
import Tequila from 'meteor/epfl:accounts-tequila'
import {encrypt} from './encryption'
import _ from 'lodash'
import findUp from 'find-up'
import '/imports/policy'
import {ZBClient} from "zeebe-node";
import {
  get_user_permitted_tasks,
  is_allowed_to_submit
} from './permission/tasks'
import {
  TaskData,
  TasksCollection,
  FormioActivityLog
} from "/imports/api/tasks"

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
  async start_workflow() {  // aka start a new instance in Zeebe terms
    // TODO: check the right to start a workflow, into the "Start workflow button"?
    const diagramProcessId = 'phdAssessProcess'

    debug(`calling for a new "phdAssessProcess" instance`)

    const zbc = new ZBClient()

    await zbc.createProcessInstance(diagramProcessId, {
      created_at: encrypt(new Date().toJSON()),
      created_by: encrypt(Meteor.userId()!),
      updated_at: encrypt(new Date().toJSON()),
    }).then(
      (res) => {
        debug(`created new instance ${diagramProcessId}, response: ${JSON.stringify(res)}`)
      })
  },
  async submit(key, data, metadata: FormioActivityLog) {
    if (!is_allowed_to_submit(key)) {
      debug("Unallowed user is trying to sumbit a task")
      throw new Meteor.Error(403, 'Error 403: Not allowed', 'Check your permission')
    }

    // TODO: check what is permitted to submit

    // load the task we may need some values
    const task:TaskData | undefined = tasks.findOne({ _id: key } )

    if (task) {
      delete data['submit']  // no thanks, I already know that
      delete data['cancel']  // no thanks, I already know that
      data.updated_at = new Date().toJSON()

      data = _.mapValues(data, x => encrypt(x))  // encrypt all data

      // append activity over other activities
      const currentActivityLog = task.activityLogs || []
      currentActivityLog.push(metadata)
      data.activityLogs = encrypt(JSON.stringify(currentActivityLog))  // add some info on the submitter

      await WorkersClient.success(task._id, data)
      tasks.remove({_id: task._id})
      debug("Submitted form result")
    } else {
      debug("Error can not find the task that is trying to be submitted")
      throw new Meteor.Error(404, 'Error 404: Unknown task', 'Check the task exist by refreshing your browser')
    }
  },
})
