import {assert} from 'chai'
import _ from "lodash";

const dbCleaner = require("meteor/xolvio:cleaner");

import {Tasks} from "/imports/model/tasks";
import {ITaskDashboard} from "/imports/policy/dashboard/type";

import {createTasksForDashboardFixtures} from "/tests/factories/dashboard/tasksFactoryV1";
import {createTasksForDashboardV2Fixtures} from "/tests/factories/dashboard/tasksFactoryV2";
import {
  getContainerV1,
  getContainerV2
} from "/tests/client/dashboard/utils";


beforeEach(async function () {
  await dbCleaner.resetDatabase();
});


describe('Dashboard full render', function () {
  it('should render V1', async function () {
    createTasksForDashboardFixtures()

    const allProcessInstanceTasks =
      await Tasks.find({'variables.dashboardDefinition': { $exists:false }}).fetchAsync() as ITaskDashboard[]
    const groupByWorkflowInstanceTasks = _.groupBy(allProcessInstanceTasks, 'processInstanceKey')

    const container = await getContainerV1()

    // same number of tasks
    assert.lengthOf(
      container.querySelectorAll(`.row:not(.dashboard-title)`),
      Object.keys(groupByWorkflowInstanceTasks).length,
      `${ container.innerHTML }`
    )
  });

  it('should render V2', async function () {
    createTasksForDashboardV2Fixtures()

    const allProcessInstanceTasks =
      await Tasks.find({'variables.dashboardDefinition': { $exists:true }}).fetchAsync() as ITaskDashboard[]
    const groupByWorkflowInstanceTasks = _.groupBy(allProcessInstanceTasks, 'processInstanceKey')

    const container = await getContainerV2()

    // same number of tasks
    assert.lengthOf(
      container.querySelectorAll(`.row:not(.dashboard-title)`),
      Object.keys(groupByWorkflowInstanceTasks).length,
      `${ container.innerHTML }`
    )
  });
});
