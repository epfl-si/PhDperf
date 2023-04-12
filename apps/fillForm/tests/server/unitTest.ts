import chai, {assert} from 'chai'
import chaiDateTime from "chai-datetime";
chai.use(chaiDateTime);

import {Meteor} from "meteor/meteor";

import {Tasks} from "/imports/model/tasks";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {initialEcolesDoctorales} from "/server/fixtures/doctoralSchools";
import dayjs from "dayjs";

const dbCleaner = require("meteor/xolvio:cleaner");
const Factory = require("meteor/dburles:factory").Factory


describe('Unit tests Tasks', function () {
  beforeEach(function () {
    dbCleaner.resetDatabase({}, () => {
      Factory.create("task");
      Factory.create("task");
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

  // testing the test engine about dates, and how we are able to filter it with Mongo
  it('should be able to read and write dates', function () {
    Factory.create("task", {
        "journal.lastSeen": dayjs().subtract(15, 'days').toISOString(),
      }
    )

    const tasks = Tasks.find({}).fetch()
    assert.isNotEmpty(tasks)

    tasks.forEach((task) => {
      assert.isDefined(task.journal.lastSeen)
      const lastSeen = new Date(task.journal.lastSeen!)
      assert.beforeOrEqualDate(lastSeen, new Date())
    })

    // can we find the obsolete one ?
    const obsoleteTasks = Tasks.find({
      "journal.lastSeen": { $lte: dayjs().subtract(1, 'day').toISOString() },
    }).fetch()
    const notObsoleteTasks = Tasks.find({
      "journal.lastSeen": { $gte: dayjs().subtract(1, 'day').toISOString() },
    }).fetch()

    assert.lengthOf(obsoleteTasks, 1)
    assert.isAbove(notObsoleteTasks.length, 1)
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
