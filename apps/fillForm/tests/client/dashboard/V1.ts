import {assert} from "chai";
import _ from "lodash";

const dbCleaner = require("meteor/xolvio:cleaner");

import {Tasks} from "/imports/model/tasks";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
const Factory = require("meteor/dburles:factory").Factory
import {generateAGenericTaskAttributes} from "/tests/factories/task";
import {
  setCoDirectorFillsAttributes, setCollabReviewAttributes, setDirectorFillsAttributes, setPHDFillsAttributes,
  setPHDFillsAttributes as setPHDFillsAttributesV1, setPHDSignsAttributes
} from "/tests/factories/dashboard/tasksFactoryV1";

import {stepsDefinitionDefault} from "/imports/ui/components/DashboardOld/DefaultDefinition";
import {getContainerV1} from "/tests/client/dashboard/utils";


beforeEach(async function () {
  await dbCleaner.resetDatabase();
});

describe('Dashboard Steps render V1 steps', function (){

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
      stepsDefinitionDefault.length - 1,
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
      stepsDefinitionDefault.length - 3,
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
      stepsDefinitionDefault.length - 3,
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
      await Tasks.find(
        {'variables.dashboardDefinition': { $exists:false }}).fetchAsync(),
        'processInstanceKey'
    ) as unknown as ITaskDashboard[]

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
      stepsDefinitionDefault.length - 3,
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
      stepsDefinitionDefault.length - 4,
      `${ container.innerHTML }`
    );
  });

  it('should render a custom content if a field is missing (dependsOn case)', async function (){
    // remove the coDirector, as the default definition depends on it
    const oneInstance= generateAGenericTaskAttributes( false)
    // create a task that is nothing to do with the co-director
    Factory.create('task', setPHDSignsAttributes(oneInstance));

    const container = await getContainerV1()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_PHD_Signs"][data-step-status="awaiting"]'),
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

  it('should not render a custom content if a field is missing but' +
    ' we are still not at this step (dependsOn case)', async function (){
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
