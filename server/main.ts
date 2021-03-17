import { Meteor } from 'meteor/meteor'

import { ZBClient } from "zeebe-node"

require("dotenv").config()

Meteor.startup(() => {
  Meteor.publish('tasks', function() {
    const added = this.added.bind(this)
    const zbc = new ZBClient()

    zbc.createWorker({
      taskType: 'fill_sectionA',
      taskHandler: function(instance : any, completed) {
        console.log(instance)
        added('workflow-tasks', instance.workflowInstanceKey, instance)
        completed.forwarded()
      },
      maxJobsToActivate: 6
    })
  })
})
