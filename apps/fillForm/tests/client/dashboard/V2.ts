import {assert} from 'chai'

const dbCleaner = require("meteor/xolvio:cleaner");
const Factory = require("meteor/dburles:factory").Factory

import {getContainerV2} from "/tests/client/dashboard/utils";
import {
  setCoDirectorFillsAttributes, setCollabReviewAttributes, setDirectorFillsAttributes,
  setMentorSignsAttributes,
  setPHDFills1Attributes,
  setPHDFills2Attributes
} from "/tests/factories/dashboard/tasksFactoryV2";
import {stepsDefinitionV2} from "/tests/factories/dashboard/dashboardDefinition";
import {generateAGenericTaskAttributes} from "/tests/factories/task";


beforeEach(async function () {
  await dbCleaner.resetDatabase();
});

describe('Dashboard Steps render V2 steps', function (){
  it('should render custom content (content case)', async function (){
    // for the test to do well, the step need an empty parent
    assert.isDefined(stepsDefinitionV2.filter(
      s => s.id === 'Activity_Thesis_Co_Director_Signs'
    )[0].customContent)

    // take any, it does not matter
    Factory.create('task', setPHDFills1Attributes());

    const container = await getContainerV2()

    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Thesis_Co_Director_Signs"][data-step-status="custom-content"]'),
      1,
      `${ container.innerHTML }`);
  });


  it('should render the floating case step as awaiting, others can be anything (floating case)', async function (){
    // for the test to do well, the step need an empty parent
    assert.isNotTrue(stepsDefinitionV2.filter(
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
    assert.isNotTrue(stepsDefinitionV2.filter(
      s => s.id === 'Activity_Post_Mentor_Meeting_Mentor_Signs'
    )[0].parents)

    // get any, but set the awaited field to a value
    const oneInstanceWithMentorDate= generateAGenericTaskAttributes()
    // @ts-ignore
    oneInstanceWithMentorDate.variables.mentorDate = '123'

    Factory.create('task', setCollabReviewAttributes(oneInstanceWithMentorDate));

    const container = await getContainerV2()

    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_Post_Mentor_Meeting_Mentor_Signs"][data-step-status="done"]'),
      1,
      `${ container.innerHTML }`);
  });

  it('should render the first step as awaiting, for the step having an alias (alias case)', async function (){
    Factory.create('task', setPHDFills1Attributes());

    const container = await getContainerV2()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll('[data-step="Activity_PHD_fills_annual_report_1"][data-step-status="awaiting"]'),
      1,
      `${ container.innerHTML }`);

    const shouldBeNotDoneList = [
      'Activity_Thesis_Co_Director_fills_annual_report',
      'Activity_Thesis_Director_fills_annual_report',
      'Activity_Thesis_Director_Collaborative_Review_Signs',
    ]

    // should be 'not-done'
    shouldBeNotDoneList.forEach( activity =>
      assert.lengthOf(
        container.querySelectorAll(
          `[data-step='${activity}'][data-step-status='not-done']`
        ),
        1,
        `${ container.innerHTML }`
      )
    )
  });

  it('should render the first step as awaiting,' +
    ' for the step being aliased (alias case)', async function (){

    // assert aliases are set
    assert.isNotEmpty(stepsDefinitionV2.filter(
      s => s.id === 'Activity_PHD_fills_annual_report_1' &&
        s.knownAs
    ))

    Factory.create('task', setPHDFills2Attributes());

    const container = await getContainerV2()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll(
        '[data-step="Activity_PHD_fills_annual_report_1"][data-step-status="awaiting"]'
      ),
      1,
      `${ container.innerHTML }`);

    const shouldBeDoneList = [
      'Activity_Thesis_Co_Director_fills_annual_report',
      'Activity_Thesis_Director_fills_annual_report',
    ]

    // should be 'not-done'
    shouldBeDoneList.forEach( activity =>
      assert.lengthOf(
        container.querySelectorAll(
          `[data-step='${activity}'][data-step-status='done']`
        ),
        1,
        `${ container.innerHTML }`
      )
    )

    assert.lengthOf(
      container.querySelectorAll(
        `[data-step='Activity_Thesis_Director_Collaborative_Review_Signs'][data-step-status='not-done']`
      ),
      1,
      `${ container.innerHTML }`
    )
  });

  it('should render the first step as awaiting,' +
    ' while having some other task going one (alias case)', async function (){
    const oneInstance = generateAGenericTaskAttributes()
    Factory.create('task', setPHDFills2Attributes(oneInstance));
    Factory.create('task', setCoDirectorFillsAttributes(oneInstance));
    Factory.create('task', setDirectorFillsAttributes(oneInstance));

    const shouldBeAwaitingList = [
      'Activity_PHD_fills_annual_report_1',
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

    assert.lengthOf(
      container.querySelectorAll(
        `[data-step-status='awaiting']`
      ),
      3,
      `${ container.innerHTML }`
    )

    assert.lengthOf(
      container.querySelectorAll(
        `[data-step='Activity_Thesis_Director_Collaborative_Review_Signs'][data-step-status='not-done']`
      ),
      1,
      `${ container.innerHTML }`
    )
  });

  it('should render the first step as done,' +
    ' while having the aliased task (alias case)', async function (){
    const oneInstance = generateAGenericTaskAttributes()
    Factory.create('task', setCoDirectorFillsAttributes(oneInstance));
    Factory.create('task', setDirectorFillsAttributes(oneInstance));

    const shouldBeAwaitingList = [
      'Activity_Thesis_Co_Director_fills_annual_report',
      'Activity_Thesis_Director_fills_annual_report',
    ]

    const container = await getContainerV2()

    assert.lengthOf(
      container.querySelectorAll(
        '[data-step="Activity_PHD_fills_annual_report_1"][data-step-status="done"]'
      ),
      1,
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
  });

  it('should render the collaborative as pending, the preceding as done' +
    ' while having the aliased task (alias case)', async function (){
    const oneInstance = generateAGenericTaskAttributes()
    Factory.create('task', setCollabReviewAttributes(oneInstance));

    const shouldBeDoneList = [
      'Activity_PHD_fills_annual_report_1',
      'Activity_Thesis_Co_Director_fills_annual_report',
      'Activity_Thesis_Director_fills_annual_report',
    ]

    const container = await getContainerV2()

    shouldBeDoneList.forEach( activity =>
      assert.lengthOf(
        container.querySelectorAll(
          `[data-step='${activity}'][data-step-status='done']`
        ),
        1,
        `${ container.innerHTML }`
      )
    )

    assert.lengthOf(
      container.querySelectorAll(
        `[data-step='Activity_Thesis_Director_Collaborative_Review_Signs'][data-step-status='awaiting']`
      ),
      1,
      `${ container.innerHTML }`
    )
  });
});
