import React from "react";
import _ from "lodash";
import styled from "styled-components";

import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {ParticipantDetail} from "/imports/model/participants";

import {stepsDefinitionDefault} from "/imports/ui/components/Dashboard/DefaultDefinition";
import {Step} from "phd-assess-meta/types/dashboards";
import {DashboardGraph as Graph} from "/imports/ui/components/Dashboard/DefinitionGraphed";


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
  { step, workflowInstanceTasks, stepDefinition }: { step: Step, workflowInstanceTasks: ITaskDashboard[], stepDefinition: Graph }
) => {
  // custom content don't need any logic, go for it directly
  if (step.content) return <StepFixedContent step={ step }>{ step.content }</StepFixedContent>

  // two main cases to manage: this is a step which a task exist, or one without a task
    // 1. get the task concerned by the current step:
  const task = workflowInstanceTasks.find(t =>
    t.elementId === step.id
  )

  if (task) {  // task exists. It can only be a pending then
    return <StepPending step={ step } task={ task }/>
  } else {  // no task cases. Let's find if it is done, not-done, or with a custom content
    // has this step an alias, meaning we have to find another task ?
    if (step.alias) {
      const taskAliased = workflowInstanceTasks.find(t =>
        step.alias!.includes(t.elementId)
      )
      if (taskAliased) return <StepPending step={ step } task={ taskAliased }/>
    }

    if (step.dependsOn?.field) {
      // yep, two cases now:
      // 1. we want a custom content if the field is missing
      if (step.dependsOn.contentOnFail &&
        !workflowInstanceTasks[0].variables[step.dependsOn.field])
        return <StepFixedContent step={ step }>{ step.dependsOn.contentOnFail }</StepFixedContent>

      // 2. we want a done / not-done if the field is missing
      if (!step.dependsOn.contentOnFail) {
        if (workflowInstanceTasks[0].variables[step.dependsOn.field]) {
          return <StepDone step={ step }/>
        } else {
          return <StepNotDone step={ step }/>
        }
      }
    }

    // Now, as:
    // - there is no task
    // - we do not depend on any field
    // let's define if we are before the pending(s) (meaning we are 'done') or after (meaning 'not-done')
    // we parse the graph tree of parent-children to get this answer
    const listPendingSteps = workflowInstanceTasks.map(t => t.elementId);

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

    if (listActivitiesBeforeThePendingOnes?.includes(step.id)) return <StepDone step={ step }/>
    if (listActivitiesAfterThePendingOnes?.includes(step.id)) return <StepNotDone step={ step }/>
    // Neither ? -> see if this is a sibling
    const siblingEdges = stepDefinition.getSiblings(step.id)

    // check if this is a sibling of a pending
    if (siblingEdges?.some(stepId => listPendingSteps.includes(stepId))) {
      return <StepDone step={ step }/>
    }

    // nothing special found, it is certainly a task to be done later
    return <StepNotDone step={ step }/>
  }
}
