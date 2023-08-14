/**
 * Define tasks to expose explicitily steps in the dashboard
 */

import {faker} from "../../factories/faker";
const Factory = require("meteor/dburles:factory").Factory
import {generateAGenericTaskAttributes} from "../task";


export const getPHDFills = () => {
  const taskAttributes = generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Phd fills annual report - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_PHD_fills_annual_report',
    ]),
  }
}

export const getCoDirectorFillsAttributes = () => {
  const taskAttributes = generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Co-Dir fills annual report - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Co_Director_fills_annual_report',
    ]),
  }
}

export const getDirectorFills = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Thesis Dir fills annual report - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Director_fills_annual_report',
    ]),
  }
}

export const getCollabReview = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Collaborative Review - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Director_Collaborative_Review_Signs',
    ]),
  }
}

export const getDirectorCollabSign = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Co-Dir signature - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisCoDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Co_Director_Signs',
    ]),
  }
}

export const getDirectorSigns = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Thesis Dir signature - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Director_Signs',
    ]),
  }
}

export const getPHDSigns = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'PhD signature - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_PHD_Signs',
    ]),
  }
}

export const getMentorSigns = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Mentor signature - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Post_Mentor_Meeting_Mentor_Signs',
    ]),
  }
}

export const getPostMentorPHDSigns = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'PhD signature after mentor - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Post_Mentor_Meeting_PHD_Signs',
    ]),
  }
}

export const getProgramDirectorSigns = () => {
  const taskAttributes= generateAGenericTaskAttributes();
  return {
    ...taskAttributes,
    'customHeaders': {
      ...taskAttributes.variables,
      'title': 'Program Director signature - Test',
    },
    'variables': {
      ...taskAttributes.variables,
      'assigneeSciper': taskAttributes.variables.thesisDirectorSciper,
      'dashboardDefinition': undefined,
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Program_Director_Signs',
    ]),
  }
}

export const createTasksForDashboardFixtures = () => {
  Factory.create('task', getPHDFills());
  Factory.create('task', getCoDirectorFillsAttributes());
  Factory.create('task', getDirectorFills());
  Factory.create('task', getCollabReview());
  Factory.create('task', getDirectorCollabSign());
  Factory.create('task', getDirectorSigns());
  Factory.create('task', getPHDSigns());
  Factory.create('task', getMentorSigns());
  Factory.create('task', getPostMentorPHDSigns());
  Factory.create('task', getProgramDirectorSigns());
}
