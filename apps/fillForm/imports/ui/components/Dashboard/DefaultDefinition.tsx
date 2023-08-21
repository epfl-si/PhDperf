import {StepsDefinition} from "phd-assess-meta/types/dashboards";


// Historically, before it was saved into the bpmn, it was a static list. Now this definitions should be into the bpmn.
// Keep this one, as it is the original, not saved into an bpmn
export const StepsDefinitionDefault: StepsDefinition = [
  {
    id: 'Activity_PHD_fills_annual_report',
    label: 'Phd fills annual report',
  },
  {
    id: 'Activity_Thesis_Co_Director_fills_annual_report',
    label: 'Co-Dir fills annual report',
    parents: ['Activity_PHD_fills_annual_report'],
    dependsOn: {
      field: 'thesisCoDirectorSciper',
      contentOnFail: 'n/a',
    },
  },
  {
    id: 'Activity_Thesis_Director_fills_annual_report',
    label: 'Thesis Dir fills annual report',
    parents: ['Activity_PHD_fills_annual_report'],
  },
  {
    id: 'Activity_Thesis_Director_Collaborative_Review_Signs',
    label: 'Collaborative review',
    parents: [
      'Activity_Thesis_Director_fills_annual_report',
      'Activity_Thesis_Co_Director_fills_annual_report'
    ],
  },
  {
    id: 'Activity_Thesis_Co_Director_Signs',
    label: 'Co-Dir signature',
    parents: ['Activity_Thesis_Director_Collaborative_Review_Signs'],
    dependsOn: {
      field: 'thesisCoDirectorSciper',
      contentOnFail: 'n/a',
    },
  },
  {
    id: 'Activity_Thesis_Director_Signs',
    label: 'Thesis Dir signature',
    parents: ['Activity_Thesis_Co_Director_Signs'],
  },
  {
    id: 'Activity_PHD_Signs',
    label: 'PhD signature',
    parents: ['Activity_Thesis_Director_Signs'],
  },
  {
    id: 'Activity_Post_Mentor_Meeting_Mentor_Signs',
    label: 'Mentor signature',
    parents: ['Activity_PHD_Signs'],
  },
  {
    id: 'Activity_Post_Mentor_Meeting_PHD_Signs',
    label: 'PhD signature after mentor',
    parents: ['Activity_PHD_Signs'],
  },
  {
    id: 'Activity_Program_Director_Signs',
    label: 'Program Director signature',
    parents: [
      'Activity_Post_Mentor_Meeting_Mentor_Signs',
      'Activity_Post_Mentor_Meeting_PHD_Signs',
    ],
  },
]

//TODO: move this into the bpmn, as output of the instance creation
//TODO: move this into the tests folder
// this definition should be into the bpmn.
// To remove any confusion, it does not represent what is going on on any bpmn.
// It is kept here as a copy, for testing purposes only.
export const StepsDefinitionV2: StepsDefinition = [
  {
    id: 'Activity_PHD_fills_annual_report_1',
    label: 'Phd fills annual report',
    twins: ['Activity_PHD_fills_annual_report_2'],
    parents: [],  // first step
  },
  {
    id: 'Activity_PHD_fills_annual_report_2',
    label: 'Phd fills annual report',
    twins: ['Activity_PHD_fills_annual_report_1'],
    parents: [],  // first step
  },
  {
    id: 'Activity_Thesis_Co_Director_fills_annual_report',
    label: 'Co-Dir fills annual report',
    dependsOn: {
      field: 'thesisCoDirectorSciper',
      contentOnFail: 'N/A',
    },
    parents: ['Activity_PHD_fills_annual_report_1'],
  },
  {
    id: 'Activity_Thesis_Director_fills_annual_report',
    label: 'Thesis Dir fills annual report',
    parents: ['Activity_PHD_fills_annual_report_1'],
  },
  {
    id: 'Activity_Thesis_Director_Collaborative_Review_Signs',
    label: 'Collab. review',
    parents: [
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
    parents: ['Activity_Thesis_Director_Signs'],
  },
  {
    id: 'Activity_Post_Mentor_Meeting_Mentor_Signs',
    label: 'Mentor signature',
    dependsOn: {
      field: 'mentorDate',
    },
    parents: undefined,  // this one is floating all along the process, without parents
  },
  {
    id: 'Activity_Program_Director_Signs',
    label: 'Program Director signature',
    parents: [
      'Activity_Post_Mentor_Meeting_Mentor_Signs',
      'Activity_PHD_Signs',
    ],
  },
]
