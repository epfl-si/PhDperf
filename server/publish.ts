import {Meteor} from "meteor/meteor";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema"
import {ImportScipersList} from "/imports/api/importScipers/schema"
import {get_user_permitted_tasks, get_user_permitted_tasks_dashboard} from "/imports/policy/tasks";
import {canEditDoctoralSchools} from "/imports/policy/doctoralSchools";
import {canImportScipersFromISA} from "/imports/policy/importScipers";

Meteor.publish('tasks', function () {
  return get_user_permitted_tasks()
})

Meteor.publish('tasksDashboard', function () {
  return get_user_permitted_tasks_dashboard()
})

Meteor.publish('doctoralSchools', function() {
  if (canEditDoctoralSchools()) {
    return DoctoralSchools.find()
  } else {
    return this.ready()
  }
})

Meteor.publish('importScipersList', function(doctoralSchoolAcronym: string) {
  if (canImportScipersFromISA()) {
    return ImportScipersList.find({ doctoralSchoolAcronym: doctoralSchoolAcronym })
  } else {
    return this.ready()
  }
})
