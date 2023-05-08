import { Meteor } from 'meteor/meteor';
import assert from 'assert';

import "./factories/task"


if (Meteor.isClient) {
  import("./imports/main")
  import("./client/main")
}

if (Meteor.isServer) {
  import("./imports/main")
  import("./server/main")
}

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
