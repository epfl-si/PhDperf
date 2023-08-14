/**
 * Define tasks to expose explicitily steps in the dashboard
 */

import {faker} from "../../factories/faker";
const Factory = require("meteor/dburles:factory").Factory
import {generateAGenericTaskAttributes} from "../task";
import {RethinkedStepsDefinitionV2} from "/imports/ui/components/Dashboard/DefaultDefinition";


const getPHDFills1 = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_PHD_fills_annual_report_1',
    ]),
  }
}

const getMentorSigns = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Post_Mentor_Meeting_Mentor_Signs',
    ]),
  }
}

const getDirectorFills = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Director_fills_annual_report',
    ]),
  }
}

const getCoDirectorFillsAttributes = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Co_Director_fills_annual_report',
    ]),
  }
}

const getPHDFills2 = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_PHD_fills_annual_report_2',
    ]),
  }
}

const getCollabReview = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Thesis_Director_Collaborative_Review_Signs',
    ]),
  }
}

const getPHDSigns = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_PHD_Signs',
    ]),
  }
}

const getProgramDirectorSigns = () => {
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
      'dashboardDefinition': RethinkedStepsDefinitionV2,
      'doctoralProgramName': 'V2',
    },
    'elementId': faker.helpers.arrayElement([
      'Activity_Program_Director_Signs',
    ]),
  }
}

export const createTasksForDashboardV2Fixtures = () => {
  Factory.create('task', getPHDFills1());
  Factory.create('task', getPHDFills2());
  Factory.create('task', getMentorSigns());
  Factory.create('task', getDirectorFills());
  Factory.create('task', getCoDirectorFillsAttributes());
  Factory.create('task', getPHDFills2());
  Factory.create('task', getCollabReview());
  Factory.create('task', getPHDSigns());
  Factory.create('task', getProgramDirectorSigns());

  // as we can have multiple task for the same workflow instance (processInstanceKey)
  // let's build some
  const processInstanceKey = 1

  Factory.create('task', {
    ...getPHDFills2(),
    "processInstanceKey": processInstanceKey
  });

  Factory.create('task', {
    ...getMentorSigns(),
    "processInstanceKey": processInstanceKey
  });

  Factory.create('task', {
    ...getDirectorFills(),
    "processInstanceKey": processInstanceKey
  });

  Factory.create('task', {
    ...getCoDirectorFillsAttributes(),
    "processInstanceKey": processInstanceKey
  });
}
