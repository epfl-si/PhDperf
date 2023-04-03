import {faker} from "/tests/factories/faker";

import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";

const _dburlesFactory = require("meteor/dburles:factory")


// currently not in used, as the default loading ones are enough.
// keeping it as a ref, "just in case"
_dburlesFactory.Factory.define('doctoralSchool', DoctoralSchools, {
  acronym: () => faker.lorem.word({ length: { min: 3, max: 7 }, strategy: "closest" }),
  label: () => faker.lorem.words(4),
  helpUrl: () => faker.internet.url(),
  creditsNeeded: () => () => faker.datatype.number({ min: 100000, max: 999999 }),
  programDirectorSciper: () => faker.sciper(),
  programDirectorName: () => faker.name.fullName(),
  administrativeAssistantAccessGroup: 'phd-assess-ops',
});
