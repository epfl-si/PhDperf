import {assert} from 'chai'

const Factory = require("meteor/dburles:factory").Factory
const dbCleaner = require("meteor/xolvio:cleaner")
const PublicationCollector = require("meteor/johanbrook:publication-collector").PublicationCollector

import "../factories/task"
import "../factories/users"
import '../../server/publish'
import dayjs from "dayjs";
import {Task, Tasks} from "/imports/model/tasks";


let userAdmin: Meteor.User
// @ts-ignore
let userAssistant: Meteor.User
let userLambda: Meteor.User
let userAssignee: Meteor.User

const userAdminId = '1'
const userAssitantId = '2'
const userAssigneeId = '3'
const userLambdaId = '4'

beforeEach(async function () {
  dbCleaner.resetDatabase({}, () => {
    userAdmin = Factory.create('userAdmin', { "_id": `${ userAdminId }` });
    userAssistant = Factory.create('userAssistant', { "_id": `${ userAssitantId }` });
    userLambda = Factory.create('user', { "_id": `${ userLambdaId }` });
    userAssignee = Factory.create('user', { "_id": `${ userAssigneeId }` });

    // one assigned task
    Factory.create("task", { "variables.assigneeSciper": userAssignee._id });
    // one lambda task
    Factory.create("task", { "variables.assigneeSciper": userLambda._id });

    // one obsolete, lambda user
    Factory.create("task", {
        "variables.assigneeSciper": userLambda._id,
        "journal.lastSeen": dayjs().subtract(15, 'days').toISOString(),
      }
    )
  });
})

describe(
  'Testing the publish method "tasksList"',
  async function () {
    describe(
      '"tasksList" to return the right tasks',
      async function () {

        await it('should return all the tasks for the admin', async function () {
          const collector = new PublicationCollector({userId: userAdmin._id});
          const collections = await collector.collect('tasksList', {}, {});

          assert.isNotEmpty(collections)
          assert.isDefined(collections.tasks)
          assert.equal(collections.tasks.length, Tasks.find({}).count())
          assert(
            collections.tasks[0].variables.assigneeSciper)
          assert(
            collections.tasks[0].variables.assigneeSciper != userAdmin._id,
            `${ collections.tasks[0].variables.assigneeSciper }`)
        });

        await it('should return the task for the assignee', async function () {
          const collector = new PublicationCollector({userId: userAssignee._id});
          const collections = await collector.collect('tasksList', {}, {});

          assert.isNotEmpty(collections)
          assert.isDefined(collections.tasks)

          assert.lengthOf(collections.tasks, 1)

          assert(
            collections.tasks[0].variables.assigneeSciper == userAssignee._id,
            `${ collections.tasks[0].variables.assigneeSciper }`)
        });

        // await it('should not return any task for a lambda user that has no tasks', async function () {
        //   const collector = new PublicationCollector({ userId: userLambda._id });
        //   const collections = await collector.collect('tasksList', {}, {});
        //
        // assert.isNotEmpty(collections)
        // assert.isDefined(collections.tasks)
        //   assert(collections.tasks === undefined)
        //   assert(!collections.tasks[0].journal.lastSeen)
        // });
      })
    describe(
      '"tasksList" to have the obsolete system working',
      async function () {

        await it('should not have journals information, only the obsolete boolean', async function () {
          const collector = new PublicationCollector({userId: userAdmin._id});
          const collections = await collector.collect('tasksList', {}, {});

          assert.isNotEmpty(collections)
          assert.isDefined(collections.tasks)
          assert.isEmpty(collections.tasks[0].journal)
          assert.isBoolean(collections.tasks[0].isObsolete)
        });

        await it('should have at least one obsolete, one non-obsolete for admin', async function () {
          const collector = new PublicationCollector({ userId: userAdmin._id });
          const collections = await collector.collect('tasksList', {}, {});

          assert.isNotEmpty(collections)
          assert.isDefined(collections.tasks)

          assert.includeMembers(
            collections.tasks.map((task: Task) => task.isObsolete),
            [false, true]
          )
        });
      })
  }
)
