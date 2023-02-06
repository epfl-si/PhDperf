import { Meteor } from 'meteor/meteor';
import assert from 'assert';

import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {initialEcolesDoctorales} from "/server/fixtures/doctoralSchools";
import {Tasks} from "/imports/model/tasks";
import "./factories/task"

const dbCleaner = require("meteor/xolvio:cleaner");
const _dburlesFactory = require("meteor/dburles:factory");


describe('PhDAssess app', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'phd-assess');
  });

  if (Meteor.isClient) {
    it('client is not server', function () {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it('server is not client', function () {
      assert.strictEqual(Meteor.isClient, false);
    });
  }
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
      //_dburlesFactory.Factory.create("doctoralSchool");

      const ds = DoctoralSchools.find({})
      assert.notStrictEqual(ds.count(), 0)
    });
  }
});

describe('Unit tests Tasks', function () {
  beforeEach(function () {
    dbCleaner.resetDatabase({}, () => {
      _dburlesFactory.Factory.create("task");
      _dburlesFactory.Factory.create("task");
    });
  });

  if (Meteor.isServer) {
    it('should have at least a task', function () {
      const tasks = Tasks.find({})
      assert.notStrictEqual(tasks.count(), 0)
      // tasks.forEach(t => {
      //   // @ts-ignore
      //   const { customHeaders, variables, ...taskLight } = t
      //   console.log(taskLight)
      // })
    });
  }
});
