import {assert} from 'chai'

const dbCleaner = require("meteor/xolvio:cleaner");
const Factory = require("meteor/dburles:factory").Factory

import {getContainerV2} from "/tests/client/dashboard/utils";
import * as V2Factory from "/tests/factories/dashboard/tasksFactoryV2";
import {stepsDefinitionV2} from "/tests/factories/dashboard/dashboardDefinition";
import {generateAGenericTaskAttributes} from "/tests/factories/task";


const activityShort = {
  phdFills: "Activity_PHD_fills_annual_report",

  mentorFills: "Activity_Post_Mentor_Meeting_Mentor_Signs",
  dirFills: "Activity_Thesis_Director_fills_annual_report",
  coDirFills: "Activity_Thesis_Co_Director_fills_annual_report",

  collabReview: "Activity_Thesis_Director_Collaborative_Review_Signs",

  phdSigns: "Activity_PHD_Signs",

  programDirSignsExceedAndDisagree: "Activity_Program_Director_Signs_Exceed_And_Disagree",
  programDirSignsUnsatisfactoryAndDisagree: "Activity_Program_Director_Signs_Unsatisfactory_And_Disagree",
  programDirSignsNeedsImprovementsAndDisagree: "Activity_Program_Director_Signs_Needs_Improvement_And_Disagree",
  programDirSignsNeedsImprovementsOrUnsatisfactoryAndDisagree: "Activity_Program_Director_Signs_Needs_Improvement_And_Disagree",

  // unused anymore
  dirSigns: "Activity_Thesis_Director_Signs",
  coDirSigns: "Activity_Thesis_Co_Director_Signs",
  thesisSigns: "Activity_Post_Mentor_Meeting_PHD_Signs",
}


beforeEach(async function () {
  await dbCleaner.resetDatabase();
});

describe('Dashboard Steps render V2 steps', function (){

  it('should render custom content (content case)', async function (){
    // for the test to do well, the step need an empty parent
    assert.isDefined(stepsDefinitionV2.filter(
      s => s.id === activityShort.coDirSigns
    )[0].customContent)

    // take any, it does not matter
    Factory.create('task', V2Factory.setPHDFillsAttributes());

    const container = await getContainerV2()

    assert.lengthOf(
      container.querySelectorAll(`[data-step=${ activityShort.coDirSigns }][data-step-status="custom-content"]`),
      1,
      `${ container.innerHTML }`);
  });

  it('should render the first step as pending,' +
    ' the others empty', async function (){

    Factory.create('task', V2Factory.setPHDFillsAttributes());

    const container = await getContainerV2()

    // first should be 'awaiting'
    assert.lengthOf(
      container.querySelectorAll(
        `[data-step=${ activityShort.phdFills }][data-step-status="awaiting"]`
      ),
      1,
      `${ container.innerHTML }`);

    assert.lengthOf(
      container.querySelectorAll(
        `[data-step-status='not-done']`
      ),
      6,
      `${ container.innerHTML }`
    )
  });

  describe('Special case : the dir / codir tasks. They are parallel.', function () {

    it('should render the codir task as pending,' +
      ' phd fill and dir fill being done, the others empty', async function () {

      const oneInstance = generateAGenericTaskAttributes()
      Factory.create('task', V2Factory.setCoDirectorFillsAttributes(oneInstance));

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.coDirFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step-status='not-done']`
        ),
        3,
        `${ container.innerHTML }`
      )
    });

    it('should render the dir task as pending,' +
      ' phd fill and co-dir fill being done, the others empty', async function () {

      const oneInstance = generateAGenericTaskAttributes()
      Factory.create('task', V2Factory.setDirectorFillsAttributes(oneInstance));

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.coDirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step-status='not-done']`
        ),
        3,
        `${ container.innerHTML }`
      )
    });

    it('should render without the codir, the dir task as pending,' +
      ' phd fill being done, the others empty', async function () {

      const oneInstance = generateAGenericTaskAttributes(false)
      Factory.create('task', V2Factory.setDirectorFillsAttributes(oneInstance));

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.coDirFills }][data-step-status="custom-content"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step-status='not-done']`
        ),
        3,
        `${ container.innerHTML }`
      )
    });

    it('should render the two parallels as done', async function () {

      Factory.create('task', V2Factory.setCollabReviewAttributes());

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.coDirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.collabReview }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step-status='not-done']`
        ),
        2,
        `${ container.innerHTML }`
      )
    });
  });

  describe('Special case : the Mentor task. Lifespan of the task is workflow wide.', function () {

    it( 'should render the mentor as empty box when PhDFills is going on', async function () {
      // yep, phdfills means mentor is still not created

      Factory.create('task', V2Factory.setPHDFillsAttributes());

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="not-done"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it( 'should render the mentor as pending when it is the only task left', async function () {
      // make the mentor task exists for that
      Factory.create('task', V2Factory.setMentorSignsAttributes());

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.coDirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);


      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.collabReview }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdSigns }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it( 'should render the mentor as pending with the program director has to sign', async function () {
      // make the mentor task exists for that
      const oneInstance = generateAGenericTaskAttributes()
      Factory.create('task', V2Factory.setMentorSignsAttributes(oneInstance));
      Factory.create('task', V2Factory.setProgramDirectorSignsUnsatisfactoryAndDisagreesAttributes(oneInstance));

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.coDirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);


      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.collabReview }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdSigns }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it( 'should render the mentor as done when PhDFills is done and the mentor does not exist', async function () {
      const oneInstance = generateAGenericTaskAttributes()
      Factory.create('task', V2Factory.setPHDSignsAttributes(oneInstance));  // using a child task of phd makes phd task done

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`
      )
    });

    it( 'should render the mentor as pending when PhDFills is done and the dir fill is awaiting', async function () {

      const oneInstance = generateAGenericTaskAttributes()
      Factory.create('task', V2Factory.setDirectorFillsAttributes(oneInstance));  // using a child task of phd makes phd task done
      Factory.create('task', V2Factory.setMentorSignsAttributes(oneInstance));

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it( 'should render the mentor as pending when PhDFills is done and the phd signs is awaiting', async function () {
      // make the mentor task exists for that
      const oneInstance = generateAGenericTaskAttributes()
      Factory.create('task', V2Factory.setPHDSignsAttributes(oneInstance));  // using a child task of phd makes phd task done
      Factory.create('task', V2Factory.setMentorSignsAttributes(oneInstance));

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdSigns }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });
  });

  describe('Special case : the Program director task. I can be one of a choice.', function () {

    it('should render the corresponding prog. dir. task as pending 1/4', async function () {
      Factory.create('task', V2Factory.setProgramDirectorSignsExceedAndDisagreeAttributes());  // using a child task of phd makes phd task done

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it('should render the corresponding prog. dir. task as pending 2/4', async function () {
      Factory.create('task', V2Factory.setProgramDirectorSignsUnsatisfactoryAndDisagreesAttributes());  // using a child task of phd makes phd task done

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it('should render the corresponding prog. dir. task as pending 3/4', async function () {
      Factory.create('task', V2Factory.setProgramDirectorSignsNeedsImprovementsAndDisagreeAttributes());  // using a child task of phd makes phd task done

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it('should render the corresponding prog. dir. task as pending 4/4', async function () {
      Factory.create('task', V2Factory.setProgramDirectorSignsNeedsImprovementsOrUnsatisfactoryAndAgreeAttributes());  // using a child task of phd makes phd task done

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.collabReview }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdSigns }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it('should render the corresponding prog. dir. task as pending with the "Improvment" typo', async function () {
      Factory.create('task', V2Factory.setProgramDirectorSignsNeedsImprovementsOrUnsatisfactoryAndAgreeAttributesWithImprovmentTypo());  // using a child task of phd makes phd task done

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.dirFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.collabReview }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.phdSigns }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);
    });

    it('should render the prog. dir. task green if there is no need of the program director ', async function () {
      Factory.create('task', V2Factory.setMentorSignsAttributesWithoutTheNeedOfTheProgramDirector());

      const container = await getContainerV2()

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.mentorFills }][data-step-status="awaiting"]`
        ),
        1,
        `${ container.innerHTML }`);

      assert.lengthOf(
        container.querySelectorAll(
          `[data-step=${ activityShort.programDirSignsExceedAndDisagree }][data-step-status="done"]`
        ),
        1,
        `${ container.innerHTML }`);
    });
  });
});
