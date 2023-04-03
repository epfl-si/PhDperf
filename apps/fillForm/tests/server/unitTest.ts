import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import assert from "assert";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {initialEcolesDoctorales} from "/server/fixtures/doctoralSchools";

const dbCleaner = require("meteor/xolvio:cleaner");
const _dburlesFactory = require("meteor/dburles:factory");


describe('Unit tests Tasks', function () {
  beforeEach(function () {
    dbCleaner.resetDatabase({}, () => {
      _dburlesFactory.Factory.create("task");
      _dburlesFactory.Factory.create("task");
    });
  });

  it('should have at least a task', function () {
    const tasks = Tasks.find({})
    assert.notStrictEqual(tasks.count(), 0)
    // tasks.forEach(t => {
    //   // @ts-ignore
    //   const { customHeaders, variables, ...taskLight } = t
    //   console.log(taskLight)
    // })
    });
});

describe('Unit tests DoctoralSchools', function () {
  beforeEach(function () {
    if ( DoctoralSchools.find({}).count() === 0 ) {
      initialEcolesDoctorales.forEach((doctoralSchool) => {
        DoctoralSchools.insert(doctoralSchool);
      });
    }
  });

  if (Meteor.isServer) {
    it('should have doctoral schools data', function () {
      // _dburlesFactory.Factory.create("doctoralSchool");

      const ds = DoctoralSchools.find({})
      assert.notStrictEqual(ds.count(), 0)
    });
  }
});
