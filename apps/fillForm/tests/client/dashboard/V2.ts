import {assert} from 'chai'

const dbCleaner = require("meteor/xolvio:cleaner");
const Factory = require("meteor/dburles:factory").Factory

import {getContainerV2} from "/tests/client/dashboard/utils";
import {
  setCoDirectorFillsAttributes, setCollabReviewAttributes, setDirectorFillsAttributes,
  setMentorSignsAttributes,
  setPHDFills1Attributes,
  setPHDFills2Attributes
} from "/tests/factories/dashboard/tasksV2";
import {StepsDefinitionV2} from "/imports/ui/components/Dashboard/DefaultDefinition";


beforeEach(async function () {
  await dbCleaner.resetDatabase();
});

describe('Dashboard Steps render V2', function (){

  it('should render the floating case step as awaiting, others can be anything (floating case)', async function (){
    // for the test to do well, the step need an empty parent
    assert.isNotTrue(StepsDefinitionV2.filter(
      s => s.id === 'Activity_Post_Mentor_Meeting_Mentor_Signs'
    )[0].parents)

    Factory.create('task', setMentorSignsAttributes());

    const container = await getContainerV2()

    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Post_Mentor_Meeting_Mentor_Signs"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);
  });

  it('should render the floating case step as done, others can be anything (floating case)', async function (){
    // for the test to do well, the step need an empty parent
    assert.isNotTrue(StepsDefinitionV2.filter(
      s => s.id === 'Activity_Post_Mentor_Meeting_Mentor_Signs'
    )[0].parents)

    // get any, it does not matter while it's not a floating
    Factory.create('task', setCollabReviewAttributes());

    const container = await getContainerV2()

    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Post_Mentor_Meeting_Mentor_Signs"][data-step-status="done"]'),
      1,
      `${ container.innerHTML }`);
  });

  it('should render the first step as awaiting (twins case)', async function (){
    Factory.create('task', setPHDFills1Attributes());

    const container = await getContainerV2()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_PHD_fills_annual_report"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);
    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionV2.length - 1,
      `${ container.innerHTML }`
    );
  });

  it('should render the first step as awaiting,' +
    ' despite not having the first step as task (twins case)', async function (){

    // assert twins are set
    assert.isNotEmpty(StepsDefinitionV2.filter(
      s => s.id === 'Activity_PHD_fills_annual_report_1' &&
        s.twins
    ))
    assert.isNotEmpty(StepsDefinitionV2.filter(
      s => s.id === 'Activity_PHD_fills_annual_report_2' &&
        s.twins
    ))

    Factory.create('task', setPHDFills2Attributes());

    const container = await getContainerV2()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll(
        // TODO: choose a way to write data-step for twins
        '[data-step="Activity_PHD_fills_annual_report"][data-step-status="awaiting"]'
      ),
      1,
      `${ container.innerHTML }`);
    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionV2.length - 1,
      `${ container.innerHTML }`
    );
  });

  it('should render the first step as awaiting,' +
    ' while having some other task going one (twins case)', async function (){
    Factory.create('task', setPHDFills2Attributes());
    Factory.create('task', setCoDirectorFillsAttributes());
    Factory.create('task', setDirectorFillsAttributes());

    const shouldBeAwaitingList = [
      'Activity_PHD_fills_annual_report_2',
      'Activity_Thesis_Co_Director_fills_annual_report',
      'Activity_Thesis_Director_fills_annual_report',
    ]

    const container = await getContainerV2()

    // should be 'awaiting'
    shouldBeAwaitingList.forEach( activity =>
      assert.lengthOf(
        container.querySelectorAll(
          `[data-step='${activity}'][data-step-status='awaiting']`
        ),
        1,
        `${ container.innerHTML }`
      )
    )

    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionV2.length - shouldBeAwaitingList.length,
      `${ container.innerHTML }`
    );
  });

  it('should render the first step as done,' +
    ' while having the twin task (twins case)', async function (){
    Factory.create('task', setCoDirectorFillsAttributes());
    Factory.create('task', setDirectorFillsAttributes());

    const shouldBeAwaitingList = [
      'Activity_Thesis_Co_Director_fills_annual_report',
      'Activity_Thesis_Director_fills_annual_report',
    ]

    const container = await getContainerV2()


    // the others not-done
    assert.lengthOf(
      container.querySelectorAll(
        '[data-step="Activity_PHD_fills_annual_report_2"][data-step-status="not-done"]'
      ),
      StepsDefinitionV2.length - shouldBeAwaitingList.length,
      `${ container.innerHTML }`
    );

    // should be 'awaiting'
    shouldBeAwaitingList.forEach( activity =>
      assert.lengthOf(
        container.querySelectorAll(
          `[data-step='${activity}'][data-step-status='awaiting']`
        ),
        1,
        `${ container.innerHTML }`
      )
    )

    // the others not-done
    assert.lengthOf(
      container.querySelectorAll('[data-step-status="not-done"]'),
      StepsDefinitionV2.length - shouldBeAwaitingList.length,
      `${ container.innerHTML }`
    );
  });
});
