/** Allow, on dev setup only, to load fixtures into the db,
 * offering to the devs a happy place with some datas to work on
 **/
import {Meteor} from "meteor/meteor";
import {createTasksForDashboardFixtures} from "/tests/factories/dashboard/tasksFactoryV1";
import {createTasksForDashboardV2Fixtures} from "/tests/factories/dashboard/tasksFactoryV2";


Meteor.methods({
  async loadFixtures() {
    if (!Meteor.isDevelopment) {
      console.error('The command loadFixtures is only usable on dev setups');
      return
    }

    console.log('loadFixtures has been called. Loading tasks fixtures..');

    await import('/tests/factories/task');

    createTasksForDashboardFixtures();
    createTasksForDashboardV2Fixtures();

    return "ok !";
  }
})
