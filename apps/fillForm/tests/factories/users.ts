import {faker} from "/tests/factories/faker";

const _dburlesFactory = require("meteor/dburles:factory")

const groupsAll = [
  "PhDAssess-Activity_Specify_Participants-Test",
  "accounts-tequila-example",
  "phd-assess-role-editor",
  "phd-assess-role-viewer",
  "phd-assess-test-role-editor",
  "phd-assess-test-role-viewer",
  "PhD-annual-report-administrative-assistant",
  "PhD-annual-report-admin"
]


const adminUserFirstName = faker.name.firstName()
const adminUserName = faker.name.lastName()

const TequilaAdminUser = {
  "firstname": adminUserFirstName,
  "email": faker.internet.email(adminUserFirstName),
  "name": adminUserName,
  "displayname": `${adminUserFirstName} ${adminUserName}`,
  "username": adminUserName.toLowerCase()
}

_dburlesFactory.Factory.define('user', Meteor.users, {
  "_id": "1",
  "tequila": {
    "provider": "",
    "group": groupsAll,
    "user": "Username",
    "org": "EPFL",
    "uniqueid": "1",
    "personaltitle": "Monsieur",
    ...TequilaAdminUser
  },
  "isAdmin": true,
  "isUberProgramAssistant": true
});
