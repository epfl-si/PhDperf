/**
 * Define tasks to expose explicitly steps in the dashboard
 */
import {faker} from "../../factories/faker";
const Factory = require("meteor/dburles:factory").Factory
import {generateAGenericTaskAttributes} from "../task";
import {RethinkedStepsDefinitionV2} from "/imports/ui/components/Dashboard/DefaultDefinition";


export const setPHDFills1Attributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Phd fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_PHD_fills_annual_report_1',
  ]),
})

export const setMentorSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Mentor signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Post_Mentor_Meeting_Mentor_Signs',
  ]),
})

export const setDirectorFillsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Thesis Dir fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Director_fills_annual_report',
  ]),
})

export const setCoDirectorFillsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Co-Dir fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Co_Director_fills_annual_report',
  ]),
})

export const setPHDFills2Attributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Phd fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_PHD_fills_annual_report_2',
  ]),
})

export const setCollabReviewAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Collaborative Review - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Director_Collaborative_Review_Signs',
  ]),
})

export const setPHDSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'PhD signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_PHD_Signs',
  ]),
})

export const setProgramDirectorSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.variables,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': RethinkedStepsDefinitionV2,
    'doctoralProgramName': 'V2',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Program_Director_Signs',
  ]),
})

export const createTasksForDashboardV2Fixtures = () => {
  Factory.create('task', setPHDFills1Attributes());
  Factory.create('task', setPHDFills2Attributes());
  Factory.create('task', setMentorSignsAttributes());
  Factory.create('task', setDirectorFillsAttributes());
  Factory.create('task', setCoDirectorFillsAttributes());
  Factory.create('task', setPHDFills2Attributes());
  Factory.create('task', setCollabReviewAttributes());
  Factory.create('task', setPHDSignsAttributes());
  Factory.create('task', setProgramDirectorSignsAttributes());

  // as we can have multiple task for the same workflow instance (processInstanceKey)
  // let's build some
  const oneInstance= generateAGenericTaskAttributes()
  Factory.create('task', setPHDFills2Attributes(oneInstance));
  Factory.create('task', setMentorSignsAttributes(oneInstance));
  Factory.create('task', setDirectorFillsAttributes(oneInstance));
  Factory.create('task', setCoDirectorFillsAttributes(oneInstance));
}
