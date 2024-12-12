import {assert} from 'chai'
import _ from "lodash";

const dbCleaner = require("meteor/xolvio:cleaner");

import {Tasks} from "/imports/model/tasks";
import {Step} from "phd-assess-meta/types/dashboards";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {convertDefinitionToGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";

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
  let allProcessInstanceTasksWithoutDefinition: ITaskDashboard[]
  let allProcessInstanceTasksWithDefinition: ITaskDashboard[]

  beforeEach(async function () {
    createTasksForDashboardFixtures()
    createTasksForDashboardV2Fixtures()

    allProcessInstanceTasksWithoutDefinition =
      await Tasks.find(
        {'variables.dashboardDefinition': { $exists:false }}
      ).fetchAsync() as unknown as ITaskDashboard[]

    allProcessInstanceTasksWithDefinition =
      await Tasks.find(
        {'variables.dashboardDefinition': { $exists:true }}
      ).fetchAsync() as unknown as ITaskDashboard[]
  });

  it('should render V1', async function () {
    assert.isNotEmpty(allProcessInstanceTasksWithoutDefinition)

    const groupByWorkflowInstanceTasks = _.groupBy(allProcessInstanceTasksWithoutDefinition, 'processInstanceKey')

    const container = await getContainerV1()

    // same number of tasks
    assert.lengthOf(
      container.querySelectorAll(`.row:not(.dashboard-title)`),
      Object.keys(groupByWorkflowInstanceTasks).length,
      `${ container.innerHTML }`
    )
  });

  it('should render V2', async function () {
    assert.isNotEmpty(allProcessInstanceTasksWithDefinition)

    const groupByWorkflowInstanceTasks = _.groupBy(allProcessInstanceTasksWithDefinition, 'processInstanceKey')
    const container = await getContainerV2()

    // same number of tasks
    assert.lengthOf(
      container.querySelectorAll(`.row:not(.dashboard-title)`),
      Object.keys(groupByWorkflowInstanceTasks).length,
      `${ container.innerHTML }`
    )
  });

  it('should respect the header order for V2', async function () {
    // have the same header order than the definition. This is more a test about the graph than the app.
    const dashboardDefinition = allProcessInstanceTasksWithDefinition[0].variables.dashboardDefinition

    assert.isDefined(dashboardDefinition)

    const definitionOrder = dashboardDefinition!.map((step: Step) => step.id)
    const graphedDefinition = convertDefinitionToGraph(
      dashboardDefinition
    )

    assert.isNotEmpty(dashboardDefinition)
    assert.isNotEmpty(graphedDefinition?.nodesOrdered())
    debugger;
    assert.deepEqual(
      definitionOrder,
      graphedDefinition?.nodesOrdered(),
      `The graphed data is not respecting the original order`)
  });
});
