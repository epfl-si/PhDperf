import {StepsDefinition} from "phd-assess-meta/types/dashboards";


// this definition should be into the bpmn.
// To remove any confusion, it does not represent what is going on in the bpmn.
// It is kept here as a copy, for testing purposes only.
export const stepsDefinitionV2: StepsDefinition = [
  {
    id: "Activity_PHD_fills_annual_report",
    label: "Phd fills annual report",
    parents: []  // first step
  },
  {
    id: "Activity_Thesis_Co_Director_fills_annual_report",
    label: "Co-Dir fills annual report",
    activatedOnField: "thesisCoDirectorSciper",
    parents: [
      "Activity_PHD_fills_annual_report"
    ]
  },
  {
    id: "Activity_Thesis_Director_fills_annual_report",
    label: "Thesis Dir fills annual report",
    parents: [
      "Activity_PHD_fills_annual_report"
    ]
  },
  {
    id: "Activity_Thesis_Director_Collaborative_Review_Signs",
    label: "Collaborative review",
    parents: [
      "Activity_Thesis_Co_Director_fills_annual_report",
      "Activity_Thesis_Director_fills_annual_report"
    ],
  },
  {
    id: "Activity_Thesis_Co_Director_Signs",
    label: "Co-Dir signature",
    customContent: ""
  },
  {
    id: "Activity_Thesis_Director_Signs",
    label: "Thesis Dir signature",
    customContent: ""
  },
  {
    id: "Activity_PHD_Signs",
    label: "PhD signature",
    parents: [
      "Activity_Thesis_Director_Collaborative_Review_Signs"
    ]
  },
  // this one is special, as it is parallel of all the workflow
  {
    id: "Activity_Post_Mentor_Meeting_Mentor_Signs",
    label: "Mentor signature",
    parents: [
      "Activity_PHD_fills_annual_report"
    ]
  },
  {
    id: "Activity_Post_Mentor_Meeting_PHD_Signs",
    label: "PhD signature after mentor",
    parents: [
      "Activity_PHD_Signs"
    ],
    customContent: ""
  },
  {
    id: "Activity_Program_Director_Signs_Exceed_And_Disagree",
    label: "Program Director signature",
    parents: [
      "Activity_PHD_Signs",
    ],
    knownAs: [
      "Activity_Program_Director_Signs_Unsatisfactory_And_Disagree",
      "Activity_Program_Director_Signs_Needs_Improvement_And_Disagree",
      "Activity_Program_Director_Signs_Needs_Improvement_Or_Unsatisfactory_And_Agree"
    ]
  },
]

// this is to test a known mistake
export const stepsDefinitionV2WithImprovmentTypo: StepsDefinition = stepsDefinitionV2.map(step => {
  if (step.knownAs) {
    const updatedKnownAs = step.knownAs.map(value => {
      if (value === "Activity_Program_Director_Signs_Needs_Improvement_And_Disagree") {
        return "Activity_Program_Director_Signs_Needs_Improvment_And_Disagree";
      } else if (value === "Activity_Program_Director_Signs_Needs_Improvement_Or_Unsatisfactory_And_Agree") {
        return "Activity_Program_Director_Signs_Needs_Improvment_Or_Unsatisfactory_And_Agree";
      }
      return value;
    });

    // Return a new object with updated knownAs array
    return {
      ...step,
      knownAs: updatedKnownAs,
    };
  }

  // Return the original object if knownAs doesn't exist
  return step;
});
