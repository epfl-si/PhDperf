/**
 * Define tasks to expose explicitly steps in the dashboard
 */
import {faker} from "../../factories/faker";
const Factory = require("meteor/dburles:factory").Factory
import {generateAGenericTaskAttributes} from "../task";
import {stepsDefinitionV2, stepsDefinitionV2WithImprovmentTypo} from "/tests/factories/dashboard/dashboardDefinition";


export const setPHDFillsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Phd fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_PHD_fills_annual_report',
  ]),
})

export const setMentorSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Mentor signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Post_Mentor_Meeting_Mentor_Signs',
  ]),
})

export const setMentorSignsAttributesWithoutTheNeedOfTheProgramDirector = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
    'notifProgramDirector': '1',  // this make the program director optional
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Post_Mentor_Meeting_Mentor_Signs',
  ]),
})

export const setDirectorFillsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Thesis Dir fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Director_fills_annual_report',
  ]),
})

export const setCoDirectorFillsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Co-Dir fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Co_Director_fills_annual_report',
  ]),
})

export const setCollabReviewAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Collaborative Review - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Director_Collaborative_Review_Signs',
  ]),
})

export const setPHDSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'PhD signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_PHD_Signs',
  ]),
})

export const setProgramDirectorSignsExceedAndDisagreeAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Program_Director_Signs_Exceed_And_Disagree',
  ]),
})

export const setProgramDirectorSignsUnsatisfactoryAndDisagreesAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Program_Director_Signs_Unsatisfactory_And_Disagree',
  ]),
})

export const setProgramDirectorSignsNeedsImprovementsAndDisagreeAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Program_Director_Signs_Needs_Improvement_And_Disagree',
  ]),
})

export const setProgramDirectorSignsNeedsImprovementsOrUnsatisfactoryAndAgreeAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Program_Director_Signs_Needs_Improvement_Or_Unsatisfactory_And_Agree',
  ]),
})

export const setProgramDirectorSignsNeedsImprovementsOrUnsatisfactoryAndAgreeAttributesWithImprovmentTypo = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': stepsDefinitionV2WithImprovmentTypo,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Program_Director_Signs_Needs_Improvement_Or_Unsatisfactory_And_Agree',
  ]),
})

export const createTasksForDashboardV2Fixtures = () => {

  let oneInstance: any = {}

  Factory.create('task', setPHDFillsAttributes());

  ////
  // Seconds steps are tricky, can have multiple configuration
  // as we can have multiple task for the same workflow instance (processInstanceKey)
  // let's build some
  oneInstance = generateAGenericTaskAttributes()
  Factory.create('task', setCoDirectorFillsAttributes(oneInstance));
  Factory.create('task', setDirectorFillsAttributes(oneInstance));
  Factory.create('task', setMentorSignsAttributes(oneInstance));

  // last one had the mentor. Let's do one withou the mentor task this time
  oneInstance = generateAGenericTaskAttributes()
  Factory.create('task', setCoDirectorFillsAttributes(oneInstance));
  Factory.create('task', setDirectorFillsAttributes(oneInstance));

  // let's get only the mentor
  Factory.create('task', setMentorSignsAttributes());

  // let's get only the mentor and the prog. dir. signs
  oneInstance = generateAGenericTaskAttributes()
  Factory.create('task', setMentorSignsAttributes(oneInstance));
  Factory.create('task', setProgramDirectorSignsUnsatisfactoryAndDisagreesAttributes(oneInstance));

  // get somes flavors of some steps
  Factory.create('task', setDirectorFillsAttributes());
  Factory.create('task', setCoDirectorFillsAttributes());
  Factory.create('task', setPHDFillsAttributes());
  Factory.create('task', setCollabReviewAttributes());
  Factory.create('task', setPHDSignsAttributes());
  Factory.create('task', setProgramDirectorSignsExceedAndDisagreeAttributes());
  Factory.create('task', setProgramDirectorSignsUnsatisfactoryAndDisagreesAttributes());
}
