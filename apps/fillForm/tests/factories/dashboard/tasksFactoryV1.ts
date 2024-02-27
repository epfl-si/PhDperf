/**
 * Define tasks to expose explicitly steps in the dashboard
 */
import {faker} from "../../factories/faker";
const Factory = require("meteor/dburles:factory").Factory
import {generateAGenericTaskAttributes} from "../task";


export const setPHDFillsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Phd fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.phdStudentSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_PHD_fills_annual_report',
  ]),
})

export const setCoDirectorFillsAttributes =  (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Co-Dir fills annual report - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Co_Director_fills_annual_report',
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
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Director_fills_annual_report',
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
    'assigneeSciper': taskAttributes.variables.phdStudentSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Director_Collaborative_Review_Signs',
  ]),
})

export const setCoDirectorSignAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Co-Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Co_Director_Signs',
  ]),
})

export const setDirectorSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Thesis Dir signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Thesis_Director_Signs',
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
    'assigneeSciper': taskAttributes.variables.phdStudentSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_PHD_Signs',
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
    'assigneeSciper': taskAttributes.variables.mentorSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Post_Mentor_Meeting_Mentor_Signs',
  ]),
})

export const setPostMentorPHDSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'PhD signature after mentor - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.phdStudentSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Post_Mentor_Meeting_PHD_Signs',
  ]),
})

export const setProgramDirectorSignsAttributes = (taskAttributes: any = generateAGenericTaskAttributes()) => ({
  ...taskAttributes,
  'customHeaders': {
    ...taskAttributes.customHeaders,
    'title': 'Program Director signature - Test',
  },
  'variables': {
    ...taskAttributes.variables,
    'assigneeSciper': taskAttributes.variables.programDirectorSciper,
    'dashboardDefinition': undefined,
    'doctoralProgramName': 'V1',
  },
  'elementId': faker.helpers.arrayElement([
    'Activity_Program_Director_Signs',
  ]),
})

export const createTasksForDashboardFixtures = () => {
  // remove the coDirector, as the default definition depends on it
  const oneInstanceWithoutCoDirector= generateAGenericTaskAttributes( false)
  // create a task that is nothing to do with the codirector
  Factory.create('task', setPHDFillsAttributes(oneInstanceWithoutCoDirector));

  Factory.create('task', setPHDFillsAttributes());
  Factory.create('task', setCoDirectorFillsAttributes());
  Factory.create('task', setDirectorFillsAttributes());

  // as we can have multiple task for the same workflow instance (processInstanceKey)
  // let's build some
  const oneInstance= generateAGenericTaskAttributes()
  Factory.create('task', setCoDirectorFillsAttributes(oneInstance));
  Factory.create('task', setDirectorFillsAttributes(oneInstance));

  Factory.create('task', setCollabReviewAttributes());
  Factory.create('task', setCoDirectorSignAttributes());
  Factory.create('task', setDirectorSignsAttributes());
  Factory.create('task', setPHDSignsAttributes());
  Factory.create('task', setMentorSignsAttributes());
  Factory.create('task', setPostMentorPHDSignsAttributes());
  Factory.create('task', setProgramDirectorSignsAttributes());
}
