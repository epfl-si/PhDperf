import {assert} from 'chai'
import {faker} from "@faker-js/faker";
import dayjs from "dayjs";

const Factory = require("meteor/dburles:factory").Factory
const dbCleaner = require("meteor/xolvio:cleaner")
const PublicationCollector = require("meteor/johanbrook:publication-collector").PublicationCollector

import {Tasks} from "/imports/model/tasks";
import "../factories/task"
import "../factories/users"
import '../../server/publish'


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
    // one lambda task for a lambda assignee
    Factory.create("task", {
        "variables.assigneeSciper": faker.random.alphaNumeric(1, {
          bannedChars: [userAdminId, userAssitantId, userAssigneeId, userLambdaId]
        })
    });
  });
})

describe(
  'Testing the publish method "tasksList"', async function () {
    describe('"tasksList" to return the right tasks', async function () {

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
          const tasks = Tasks.find({'variables.assigneeSciper': userAssignee._id}).fetch()
          assert.isNotEmpty(tasks)

          const collector = new PublicationCollector({userId: userAssignee._id});
          const collections = await collector.collect('tasksList', {}, {});

          assert.isNotEmpty(collections)
          assert.isDefined(collections.tasks)
          assert.isAbove(collections.tasks.length, 0)
        })

        await it('should not return any task for a lambda user that has no tasks assigned', async function () {
          const tasks = Tasks.find({'variables.assigneeSciper': userLambda._id}).fetch()
          assert.isEmpty(tasks)

          const collector = new PublicationCollector({ userId: userLambda._id });
          const collections = await collector.collect('tasksList', {}, {});
          assert.isEmpty(collections)
        });
      })

    describe('"tasksList" to have the obsolete system working', async function () {

        await it('should not have journals information, only the obsolete boolean', async function () {
          const collector = new PublicationCollector({userId: userAdmin._id});
          const collections = await collector.collect('tasksList', {}, {});

          assert.isNotEmpty(collections)
          assert.isDefined(collections.tasks)
          assert.isEmpty(collections.tasks[0].journal)
          assert.isBoolean(collections.tasks[0].isObsolete)
        });

        await it('should not return the task to the assignee if task is obsolete', async function () {
          // get count before the obsolete add
          const beforeCollector = new PublicationCollector({userId: userAssignee._id});
          const beforeCollections = await beforeCollector.collect('tasksList', {}, {});
          const countTasksBefore = beforeCollections.tasks.length

          Factory.create("task", {
              "variables.assigneeSciper": userAssignee._id,
              "journal.lastSeen": dayjs().subtract(15, 'days').toISOString(),
            }
          )

          const collector = new PublicationCollector({userId: userAssignee._id});
          const collections = await collector.collect('tasksList', {}, {});

          assert.equal(collections.tasks.length, countTasksBefore)
        })

        await it('should return the obsolete task to the admin', async function () {
          // get count before the obsolete add
          const beforeCollector = new PublicationCollector({userId: userAdmin._id});
          const beforeCollections = await beforeCollector.collect('tasksList', {}, {});
          const countTasksBefore = beforeCollections.tasks.length

          // one obsolete, lambda user
          Factory.create("task", {
              "variables.assigneeSciper": userAssignee._id,
              "journal.lastSeen": dayjs().subtract(15, 'days').toDate(),
            }
          )

          const collector = new PublicationCollector({userId: userAdmin._id});
          const collections = await collector.collect('tasksList', {}, {});

          assert.isNotEmpty(collections)
          assert.isAbove(collections.tasks.length, countTasksBefore)
        })
      })
  }
)
