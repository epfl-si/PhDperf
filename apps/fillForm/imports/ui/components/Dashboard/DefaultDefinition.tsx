import {StepsDefinition} from "phd-assess-meta/types/dashboards";


//TODO: rename without the Rethinked, once it's ready
// Historically, before it was saved into the bpmn, it was a static list. Now this definitions should be into the bpmn.
// Keep this one, as it is the original, not saved into an bpmn
export const RethinkedStepsDefinitionDefault: StepsDefinition = [
  {
    id: 'Activity_PHD_fills_annual_report',
    label: 'Phd fills annual report',
  },
  {
    id: 'Activity_Thesis_Co_Director_fills_annual_report',
    label: 'Co-Dir fills annual report',
    parentIds: ['Activity_PHD_fills_annual_report'],
  },
  {
    id: 'Activity_Thesis_Director_fills_annual_report',
    label: 'Thesis Dir fills annual report',
    parentIds: ['Activity_PHD_fills_annual_report'],
  },
  {
    id: 'Activity_Thesis_Director_Collaborative_Review_Signs',
    label: 'Collaborative review',
    parentIds: [
      'Activity_Thesis_Director_fills_annual_report',
      'Activity_Thesis_Co_Director_fills_annual_report'
    ],
  },
  {
    id: 'Activity_Thesis_Co_Director_Signs',
    label: 'Co-Dir signature',
    parentIds: ['Activity_Thesis_Director_Collaborative_Review_Signs'],
  },
  {
    id: 'Activity_Thesis_Director_Signs',
    label: 'Thesis Dir signature',
    parentIds: ['Activity_Thesis_Co_Director_Signs'],
  },
  {
    id: 'Activity_PHD_Signs',
    label: 'PhD signature',
    parentIds: ['Activity_Thesis_Director_Signs'],
  },
  {
    id: 'Activity_Post_Mentor_Meeting_Mentor_Signs',
    label: 'Mentor signature',
    parentIds: ['Activity_PHD_Signs'],
  },
  {
    id: 'Activity_Post_Mentor_Meeting_PHD_Signs',
    label: 'PhD signature after mentor',
    parentIds: ['Activity_PHD_Signs'],
  },
  {
    id: 'Activity_Program_Director_Signs',
    label: 'Program Director signature',
    parentIds: [
      'Activity_Post_Mentor_Meeting_Mentor_Signs',
      'Activity_Post_Mentor_Meeting_PHD_Signs',
    ],
  },
]

//TODO: move this into the bpmn, as output of the instance creation
//TODO: rename without the Rethinked, once it's ready
export const RethinkedStepsDefinitionV2: StepsDefinition = [
  {
    id: ['Activity_PHD_fills_annual_report_1', 'Activity_PHD_fills_annual_report_2'],
    label: 'Phd fills annual report',
    parentIds: [],  // first step
  },
  {
    id: 'Activity_Thesis_Co_Director_fills_annual_report',
    label: 'Co-Dir fills annual report',
    dependsOn: {
      field: 'coDirectorSciper',
      contentOnFail: 'N/A',
    },
    parentIds: ['Activity_PHD_fills_annual_report_1'],
  },
  {
    id: 'Activity_Thesis_Director_fills_annual_report',
    label: 'Thesis Dir fills annual report',
    parentIds: ['Activity_PHD_fills_annual_report_1'],
  },
  {
    id: 'Activity_Thesis_Director_Collaborative_Review_Signs',
    label: 'Collab. review',
    parentIds: [
      'Activity_PHD_fills_annual_report_2',
      'Activity_Thesis_Co_Director_fills_annual_report',
      'Activity_Thesis_Director_fills_annual_report',
    ],
  },
  {
    id: 'Activity_Thesis_Co_Director_Signs',
    label: 'Co-Dir signature',
    content: 'N/A for V2',
  },
  {
    id: 'Activity_Thesis_Director_Signs',
    label: 'Thesis Dir signature',
    content: 'N/A for V2',
  },
  {
    id: 'Activity_PHD_Signs',
    label: 'PhD signature',
    parentIds: ['Activity_Thesis_Director_Signs'],
  },
  {
    id: 'Activity_Post_Mentor_Meeting_Mentor_Signs',
    label: 'Mentor signature',
    dependsOn: {
      field: 'mentorDate',
    },
    parentIds: undefined,  // this one is floating all along the process, without parents
  },

  {
    id: 'Activity_Program_Director_Signs',
    label: 'Program Director signature',
    parentIds: [
      'Activity_Post_Mentor_Meeting_Mentor_Signs',
      'Activity_PHD_Signs',
    ],
  },
]
