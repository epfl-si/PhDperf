import React from "react";
import {assert} from 'chai'

import {render} from '@testing-library/react'

import {DashboardContent} from "/imports/ui/components/Dashboard/Dashboard";
import {
  StepsDefinitionDefault,
  StepsDefinitionV2
} from "/imports/ui/components/Dashboard/DefaultDefinition";
import {Tasks} from "/imports/model/tasks";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import _ from "lodash";
import {
  createTasksForDashboardFixtures,
  setCoDirectorFillsAttributes,
  setCollabReviewAttributes,
  setDirectorFillsAttributes,
  setPHDFillsAttributes,
  setPHDFillsAttributes as setPHDFillsAttributesV1
} from "/tests/factories/dashboard/tasksV1";
import {createTasksForDashboardV2Fixtures} from "/tests/factories/dashboard/tasksV2";
//import {setPHDFills1Attributes as setPHDFills1AttributesV2} from "/tests/factories/dashboard/tasksV2";
import {StepsDefinition} from "phd-assess-meta/types/dashboards";
import {generateAGenericTaskAttributes} from "/tests/factories/task";
import {convertDefinitionToGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";

const dbCleaner = require("meteor/xolvio:cleaner");
const Factory = require("meteor/dburles:factory").Factory


beforeEach(async function () {
  await dbCleaner.resetDatabase();
});

/*
 * Create the Dashboard and do basic assertions
 */
const getAndCheckDashboardContainer = (tasks: ITaskDashboard[], dashboardDefinition: StepsDefinition) => {
  const definitionGraph = convertDefinitionToGraph(dashboardDefinition)

  const { container } = render(
    <DashboardContent
      key={ Object.keys({RethinkedStepsDefinitionDefault: StepsDefinitionDefault})[0] }
      headerKey={ Object.keys({RethinkedStepsDefinitionDefault: StepsDefinitionDefault})[0] }
      definitionForHeader={ definitionGraph }
      tasks={ tasks }
    />
  );

  const dashboard = container.querySelector(`.dashboard`)
  assert.exists(dashboard, `${ container.innerHTML }`)

  // empty dashboard please not
  assert.isAbove(
    container.querySelectorAll(`.row:not(.dashboard-title)`).length,
    0
  )

  return container
}

/*
 * Get a dashboard container for V1
 */
const getContainerV1 = async () => {
  const allProcessInstanceTasks =
    await Tasks.find({'variables.dashboardDefinition': { $exists:false }}).fetchAsync() as ITaskDashboard[]

  assert.isNotEmpty(allProcessInstanceTasks, `${JSON.stringify(allProcessInstanceTasks)}`)

  return getAndCheckDashboardContainer(allProcessInstanceTasks, StepsDefinitionDefault)
}

/*
 * Get a dashboard container for V2
 */
const getContainerV2 = async () => {
  const allProcessInstanceTasks =
    await Tasks.find({'variables.dashboardDefinition': { $exists:true }}).fetchAsync() as ITaskDashboard[]

  assert.isNotEmpty(allProcessInstanceTasks, `${JSON.stringify(allProcessInstanceTasks)}`)

  return getAndCheckDashboardContainer(allProcessInstanceTasks, StepsDefinitionV2)
}


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

describe('Dashboard Steps render V1', function (){

  it('should render the first step as awaiting', async function (){
    Factory.create('task', setPHDFillsAttributesV1());

    const container = await getContainerV1()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_PHD_fills_annual_report"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);
    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionDefault.length - 1,
      `${ container.innerHTML }`
    );
  });

  it('should render the second step as awaiting, third as done (sibling case)', async function (){
    Factory.create('task', setCoDirectorFillsAttributes());

    const container = await getContainerV1()

    // first should be done
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_PHD_fills_annual_report"][data-step-status="done"]'),
      1,
      `Cannot find the Activity_PHD_fills_annual_report with done status. ${ container.innerHTML }`);
    // second should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Thesis_Co_Director_fills_annual_report"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);
    // third should be 'done'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Thesis_Director_fills_annual_report"][data-step-status="done"]'),
      1,
      `${ container.innerHTML }`);
    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionDefault.length - 3,
      `${ container.innerHTML }`
    );
  });

  it('should render the second as done, third as awaiting (sibling case)', async function (){
    Factory.create('task', setDirectorFillsAttributes());

    const container = await getContainerV1()

    // first should be done
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_PHD_fills_annual_report"][data-step-status="done"]'),
      1,
      `Cannot find the Activity_PHD_fills_annual_report with done status. ${ container.innerHTML }`);
    // second should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Thesis_Co_Director_fills_annual_report"][data-step-status="done"]'),
      1,
      container.innerHTML);
    // third should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Thesis_Director_fills_annual_report"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);
    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionDefault.length - 3,
      `${ container.innerHTML }`
    );
  });

  it('should render second as awaiting, third as awaiting (sibling case)', async function (){
    const oneInstance= generateAGenericTaskAttributes()
    Factory.create('task',
      setCoDirectorFillsAttributes(oneInstance)
    );
    Factory.create('task',
      setDirectorFillsAttributes(oneInstance)
    );

    const allProcessInstanceTasks = _.uniqBy(
      await Tasks.find({'variables.dashboardDefinition': { $exists:false }}).fetchAsync(),
      'processInstanceKey') as ITaskDashboard[]
    assert.isAbove(
      allProcessInstanceTasks.length,
      0,
      `${ JSON.stringify(allProcessInstanceTasks) }`
    )

    const container = await getContainerV1()

    // first should be done
    assert.lengthOf(
      container.querySelectorAll(
        '[data-step="Activity_PHD_fills_annual_report"][data-step-status="done"]'
      ),
      1,
      `Cannot find the Activity_PHD_fills_annual_report with done status. ${ container.innerHTML }`);
    // second should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll(
        '[data-step="Activity_Thesis_Co_Director_fills_annual_report"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`
    );
    // third should be 'done'
    assert.lengthOf(
      container.querySelectorAll(
        '[data-step="Activity_Thesis_Director_fills_annual_report"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`
    );
    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionDefault.length - 3,
      `${ container.innerHTML }`
    );
  });

  it('should render the second as done, third as awaiting (sibling case)', async function (){
    Factory.create('task', setCollabReviewAttributes());

    const container = await getContainerV1()

    // first three should be done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="done"]'),
      3,
      `The first three are not done as expected. ${ container.innerHTML }`);
    // the task should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Thesis_Director_Collaborative_Review_Signs"][data-step-status="awaiting"]'),
      1,
      container.innerHTML);
    // other should not be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);
    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionDefault.length - 4,
      `${ container.innerHTML }`
    );
  });

  it('should render a custom content if a field is missing (dependsOn case)', async function (){
    // remove the coDirector, as the default definition depends on it
    const oneInstance= generateAGenericTaskAttributes( false)
    // create a task that is nothing to do with the codirector
    Factory.create('task', setPHDFillsAttributes(oneInstance));

    const container = await getContainerV1()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_PHD_fills_annual_report"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);
    // some should be custom-content
    assert.isAbove(
      container.querySelectorAll('[data-step-status="custom-content"]').length,
      0
    )
    // the others not-done
    assert.isAbove(
      container.querySelectorAll('[data-step-status="not-done"]').length,
      0
    )
  });
});

//
// describe.skip('Dashboard Steps render V2', function (){
//   it('should render the first step as awaiting', async function () {
//     Factory.create('task', getPHDFillsV2_1());
//
//     const allProcessInstanceTasks = _.uniqBy(
//       await Tasks.find({ 'variables.dashboardDefinition': { $exists: true } }).fetchAsync(),
//       'processInstanceKey') as ITaskDashboard[]
//
//
//     assert.isAbove(
//       allProcessInstanceTasks.length,
//       0,
//       `${ JSON.stringify(allProcessInstanceTasks) }`
//     )
//
//     const dashboardDefinition = allProcessInstanceTasks[0].variables.dashboardDefinition
//
//     const { container } = render(
//       <DashboardContent
//         key={ JSON.stringify(dashboardDefinition) }
//         definition={ JSON.stringify(dashboardDefinition) }
//         tasks={ allProcessInstanceTasks }
//       />
//     );
//
//     checkForDashboardContainerSanity(container)
//
//     // same number of tasks
//     assert.lengthOf(
//       container.querySelectorAll(`.row:not(.dashboard-title)`),
//       allProcessInstanceTasks.length
//     )
//
//     // first should be 'awaiting'
//     assert.lengthOf(
//       container.querySelectorAll('[data-step-status="awaiting"]'),
//       1,
//       `${ container.innerHTML }`);
//     // the others not-done
//     assert.lengthOf(
//       container.querySelectorAll('[data-step-status="not-done"]'),
//       RethinkedStepsDefinitionV2.map(step => step.id).flat().length - 1,
//       `${ container.innerHTML }`
//     );
//   });
// });
