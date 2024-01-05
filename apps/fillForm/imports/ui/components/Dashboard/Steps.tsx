import React from "react";
import _ from "lodash";
import styled from "styled-components";

import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {ParticipantDetail} from "/imports/model/participants";

import {stepsDefinitionDefault} from "/imports/ui/components/Dashboard/DefaultDefinition";
import {Step} from "phd-assess-meta/types/dashboards";
import {DashboardGraph as Graph, fixStepKnownAsTypo} from "/imports/ui/components/Dashboard/DefinitionGraphed";


const StepNotDone = ({ step }: { step: Step }) =>
  <DashboardStep
    className="border col m-1 p-2 text-white"
    data-step={ step.id }
    data-step-status={ 'not-done' }
  />

const StepDone = ({ step }: { step: Step }) =>
  <DashboardStep
    className="border col m-1 p-2 bg-success text-white"
    data-step={ step.id }
    data-step-status={ 'done' }
  />

const StepFixedContent = ({ step, children }: {step: Step, children: React.ReactNode }) =>
  <DashboardCustomContent
    className="border col m-1 p-2 text-center small"
    data-step={ step.id }
    data-step-status={ 'custom-content' }
  >
    { children }
  </DashboardCustomContent>

const DashboardStep = styled.div`
  height: 2.35rem;
  max-height: 2.35rem;
  min-height: 2.35rem;
`;

const BgAwaiting = styled(DashboardStep)`
  background-color: #ff9933;
`;

const DashboardCustomContent = styled(DashboardStep)`
  background-color: #E6E6E6;
  padding-top: 0.65rem !important;
  font-size: 0.7rem;
`;

const StepPending = ({step, task }: {step: Step, task: ITaskDashboard }) => {
  let assignees: ParticipantDetail[] | undefined = task.assigneeScipers && Object.values(task.participants).filter((participant: ParticipantDetail) => task.assigneeScipers!.includes(participant.sciper))

  assignees = (assignees && assignees.length > 1) ? _.uniqWith(assignees, _.isEqual) : assignees  // make it uniqu if we have multiple roles
  let onHoverInfo = ``

  const currentStepLabel = _.flatten(stepsDefinitionDefault).find((step) => step.id === task!.elementId)
  if (currentStepLabel) onHoverInfo += `Step: ${currentStepLabel?.label}\n`

  const assigneesLabel = assignees?.map((assignee: ParticipantDetail) => ` ${assignee.name} (${assignee.sciper})`).join(',') ?? ''
  if (assigneesLabel) onHoverInfo += `Assignee: ${assigneesLabel}\n`
  if (task!.updated_at) onHoverInfo += `Preceding step completion date: ${task.updated_at!.toLocaleString('fr-CH', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })}`

  return (
    <BgAwaiting className="border col m-1 p-2 text-white"
                data-step={ step.id }
                data-step-status={ 'awaiting' }
                data-toggle="tooltip"
                title={ onHoverInfo } />
  )
}

/**
 * Return the good color/text step, for a given workflowInstanceTasks and his dashboard steps definition
 */
export const DashboardRenderedStep = (
  { step, workflowInstanceTasks, stepDefinition }:
    { step: Step, workflowInstanceTasks: ITaskDashboard[], stepDefinition: Graph }
) => {
  // the best to identify if we have a new generation of task is to see if they have their dashboard definition variable set.
  // that's not ideal, I know, but the only way to move forward prod. right now
  const isV2 = workflowInstanceTasks[0].variables.dashboardDefinition ?? false
  const additionalPendings: string[] = []  // if we have to manually set some pending

  step = fixStepKnownAsTypo(step)

  // for latter use, to manage the knownAs
  let mappedIdKnownAs: { [key: string]: string } = {}

  // custom content don't need any logic, go for it directly
  if (step.customContent !== undefined)
    return <StepFixedContent step={ step }>{ step.customContent }</StepFixedContent>

  // two main cases to manage: this is a step which a task exist, or one without a task
  // 1. get the task concerned by the current step:
  const task = workflowInstanceTasks.find(
    t => t.elementId === step.id
  )

  if (task) {  // task exists. It can only be a pending then
    return <StepPending step={ step } task={ task }/>
  } else {  // no task cases. Let's find if it is done, not-done, or with a custom content

    if (isV2) {  // V2 has some special cases
      ////
      // the mentor became a task that spans his lifetime trough near all the workflow
      //

      // quickhack: if the only left case is the mentor, we can set the majority of the task as green
      if (workflowInstanceTasks.length == 1 &&
        workflowInstanceTasks[0].elementId == 'Activity_Post_Mentor_Meeting_Mentor_Signs')
      additionalPendings.push(
        'Activity_Thesis_Director_Collaborative_Review_Signs',
        'Activity_PHD_Signs',
        'Activity_Program_Director_Signs_Exceed_And_Disagree',
      )

      if (step.id === 'Activity_Post_Mentor_Meeting_Mentor_Signs') {

        // is the phdFills going on ?
        const phdFills = workflowInstanceTasks.find(
          t => t.elementId === 'Activity_PHD_fills_annual_report'
        )

        return phdFills ?
          <StepNotDone step={ step }/> :
          <StepDone step={ step }/>
      }
      // end of the mentor specific rules
      /////

      // has this step an alias ?, meaning his color can come from another task
      if (step.knownAs) {
        const taskAliased = workflowInstanceTasks.find(
          t => step.knownAs!.includes(t.elementId)
        )

        if (taskAliased) {
          return <StepPending step={ step } task={ taskAliased }/>
        }
      }

      // As we have to manage knownAs in the tree later too, for the task that has to be marked as Done,
      // o prepare yourself to convert the aliased id to the original one with this new structure
      workflowInstanceTasks[0].variables.dashboardDefinition.forEach( (step: Step ) => {
        step = fixStepKnownAsTypo(step)
        step.knownAs?.forEach(knownId => {
          mappedIdKnownAs[knownId] = step.id;
        });
      });
    }

    // we want a deactivated content if the asked field is missing.
    // if not, continue the process, as a normal case
    if (step.activatedOnField) {
      if (!workflowInstanceTasks[0].variables[step.activatedOnField])
        return <StepFixedContent step={ step }>{ null }</StepFixedContent>
    }

    // Now, as:
    // - there is no task
    // - we do not depend on any field
    // let's define if we are before the pending(s) (meaning we are 'done') or after (meaning 'not-done')
    // we parse the graph tree of parent-children to get this answer.
    const listPendingStepsAliased = workflowInstanceTasks.map(t => t.elementId);

    const listPendingSteps =
      listPendingStepsAliased.map(
        ( step ) => Object.keys( mappedIdKnownAs ).includes(step) ?
          mappedIdKnownAs[step] :
          step
      )

    // check if we are sibling of any
    const siblingEdges = stepDefinition.getSiblings(step.id)
    // check if this is a sibling
    if (siblingEdges?.some(stepId => listPendingSteps.includes(stepId))) {
      return <StepDone step={ step }/>
    }

    let listActivitiesBeforeThePendingOnes: string[] = []
    listPendingSteps.forEach((pendingStepId) => {
      listActivitiesBeforeThePendingOnes = [
        ...listActivitiesBeforeThePendingOnes,
        ...stepDefinition.getAllParents(pendingStepId),
      ]
    })

    let listActivitiesAfterThePendingOnes: string[] = []
    listPendingSteps.forEach((pendingStepId) => {
      listActivitiesAfterThePendingOnes = [
        ...listActivitiesAfterThePendingOnes,
        ...stepDefinition.getAllChildren(pendingStepId),
      ]
    })

    if (
      listActivitiesBeforeThePendingOnes?.includes(step.id) ||
      additionalPendings.includes(step.id)
    ) return <StepDone step={ step }/>
    if (listActivitiesAfterThePendingOnes?.includes(step.id)) return <StepNotDone step={ step }/>

    // nothing special found, it is certainly a task to be done later
    return <StepNotDone step={ step }/>
  }
}
