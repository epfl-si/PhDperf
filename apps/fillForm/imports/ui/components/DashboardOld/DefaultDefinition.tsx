import {StepsDefinition} from "phd-assess-meta/types/dashboards";


// Historically, before it was saved into the bpmn, it was a static list. Now this definitions should be into the bpmn.
// Keep this one, as it is the original, not saved into a bpmn, used as the default
export const stepsDefinitionDefault: StepsDefinition = [
  {
    id: 'Activity_PHD_fills_annual_report',
    label: 'Phd fills annual report',
  },
  {
    id: 'Activity_Thesis_Co_Director_fills_annual_report',
    label: 'Co-Dir fills annual report',
    parents: ['Activity_PHD_fills_annual_report'],
    activatedOnField: 'thesisCoDirectorSciper',
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
    activatedOnField: 'thesisCoDirectorSciper',
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
