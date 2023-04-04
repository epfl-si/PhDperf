import {faker} from "/tests/factories/faker";
const Factory = require("meteor/dburles:factory").Factory

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

const createRandomUser = () => {
  const sciper = faker.sciper();
  const sex = faker.name.sexType();
  const firstName = faker.name.firstName(sex);
  const lastName = faker.name.lastName(sex);
  const email = faker.helpers.unique(faker.internet.email, [
    firstName.toLowerCase(),
    lastName.toLowerCase(),
  ]);

  return {
    "_id": sciper,
    "tequila": {
      "firstname": firstName,
      "provider": "",
      "email": email,
      "group": groupsAll,
      "user": lastName.toLowerCase(),
      "org": "EPFL",
      "name": lastName,
      "uniqueid": sciper,
      "username": lastName.toLowerCase(),
      "displayname": `${ firstName } ${ lastName }`,
      "personaltitle": sex === 'female' ? 'Madame' : 'Monsieur',
    }
  };
}

Factory.define('user', Meteor.users, createRandomUser());

Factory.define('userAssistant', Meteor.users,
  Factory.extend("user", {
    "isUberProgramAssistant": true
  })
);

Factory.define('userAdmin', Meteor.users,
  Factory.extend("user", {
    "isAdmin": true,
  })
);
