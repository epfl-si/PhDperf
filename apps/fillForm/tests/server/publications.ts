import assert from 'assert'
import * as sinon from "ts-sinon";

import "../factories/task"
import "../factories/users"

import '../../server/publish'

const Factory = require("meteor/dburles:factory").Factory
const dbCleaner = require("meteor/xolvio:cleaner")
const PublicationCollector = require("meteor/johanbrook:publication-collector")

let userAdmin: Meteor.User
// @ts-ignore
let userAssistant: Meteor.User
let userLambda: Meteor.User
let userAssignee: Meteor.User

const userAdminId = '1'
const userAssitantId = '2'
const userAssigneeId = '3'
const userLambdaId = '4'

beforeEach(async function() {
  dbCleaner.resetDatabase({}, () => {
    userAdmin = Factory.create('userAdmin', { "_id": `${ userAdminId }` });
    userAssistant = Factory.create('userAssistant', { "_id": `${ userAssitantId }` });
    userLambda = Factory.create('user', { "_id": `${ userLambdaId }` });
    userAssignee = Factory.create('user', { "_id": `${ userAssigneeId }` });

    // one assigned task
    Factory.create("task", { "variables.assigneeSciper" : userAssignee._id });
    // one lambda task
    Factory.create("task", { "variables.assigneeSciper" : userLambda._id });
  });
})

describe(
  'Testing the publish method "tasksList" to have the right data',
  async function () {

  beforeEach(function () {
    // choose the one connected
    sinon.default.stub(Meteor, 'user').callsFake(() => userAssignee);
    sinon.default.stub(Meteor, 'userId').callsFake(() => userAssignee._id);
  });

  await it('should return all the tasks for the admin', async function () {
    const collector = new PublicationCollector.PublicationCollector({ userId: userAdmin._id });
    const collections = await collector.collect('tasksList', {}, {});

    assert(collections.tasks)
    assert(collections.tasks.length == 2)
    assert(
      collections.tasks[0].variables.assigneeSciper)
    assert(
      collections.tasks[0].variables.assigneeSciper != userAdmin._id,
      `${collections.tasks[0].variables.assigneeSciper}`)
  });

  await it('should not have journals information', async function () {
    const collector = new PublicationCollector.PublicationCollector({ userId: userAdmin._id });
    const collections = await collector.collect('tasksList', {}, {});

    const taskJournal = collections.tasks[0].journal
    assert(
      taskJournal ? Object.keys(taskJournal).length === 0 : true)

    assert(!collections.tasks[0].isObsolete)
  });

  await it('should mark task as obsolete for admin', async function () {
    const collector = new PublicationCollector.PublicationCollector({ userId: userAdmin._id });
    const collections = await collector.collect('tasksList', {}, {});

    assert(collections.tasks, `${JSON.stringify(collections, null, 2)}`)
    assert(collections.tasks.length > 0)

    assert(collections.tasks[0].journal)
    assert(!collections.tasks[0].isObsolete)
  });

  // await it('should return the task for the assignee', async function () {
  //   const collector = new PublicationCollector.PublicationCollector({ userId: userAssignee._id });
  //   const collections = await collector.collect('tasksList', {}, {});
  //
  //   assert(collections.tasks, `${JSON.stringify(collections, null, 2)}`)
  //   assert(collections.tasks.length == 1)
  //
  //   assert(
  //     collections.tasks[0].variables.assigneeSciper == userAssignee._id,
  //     `${collections.tasks[0].variables.assigneeSciper}`)
  //
  // });
  //
  // await it('should not return any task for a lambda user that has no tasks', async function () {
  //   const collector = new PublicationCollector.PublicationCollector({ userId: userLambda._id });
  //   const collections = await collector.collect('tasksList', {}, {});
  //
  //   assert(collections.tasks === undefined)
  //   assert(!collections.tasks[0].journal.lastSeen)
  // });
})
