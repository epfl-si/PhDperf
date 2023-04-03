import assert from 'assert'
import * as sinon from "ts-sinon";

import "../factories/task"
import "../factories/users"
import '../../server/publish'

const _dburlesFactory = require("meteor/dburles:factory")
const dbCleaner = require("meteor/xolvio:cleaner")
const PublicationCollector = require("meteor/johanbrook:publication-collector")


describe('Test publications methods on TasksList', async function () {
  beforeEach(function () {
    dbCleaner.resetDatabase({}, () => {
      _dburlesFactory.Factory.create("task");
      _dburlesFactory.Factory.create("task");

      const currentUser = _dburlesFactory.Factory.create('user');

      sinon.default.stub(Meteor, 'user').callsFake(() => currentUser);
      sinon.default.stub(Meteor, 'userId').callsFake(() => currentUser._id);
    });
  });

  await it('should return tasks for the list', async function () {
    const collector = new PublicationCollector.PublicationCollector({ userId: '1'});
    const collections = await collector.collect('tasksList', {}, {});

    assert(collections.tasks)
    assert(collections.tasks.length > 0, `${JSON.stringify(collections)}`)
  });
})

