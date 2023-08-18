import React from "react";
import styled from "styled-components";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {ParticipantDetail} from "/imports/model/participants";
import _ from "lodash";
import {StepsDefinitionDefault} from "/imports/ui/components/Dashboard/DefaultDefinition";
import {Step} from "phd-assess-meta/types/dashboards";
import graphlib from "@dagrejs/graphlib";
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
    className="border col m-1 p-2 text-center"
    data-step={ step.id }
    data-step-status={ 'custom-content' }
  >
    { children }
  </DashboardCustomContent>

const DashboardStep = styled.div`
  height: 3em;
  max-height: 3em;
  min-height: 3em;
`;

const BgAwaiting = styled(DashboardStep)`
  background-color: #ff9933;
`;

const DashboardCustomContent = styled(DashboardStep)`
  background-color: #E6E6E6;
`;

const StepPending = ({step, task }: {step: Step, task: ITaskDashboard }) => {
  let assignees: ParticipantDetail[] | undefined = task.assigneeScipers && Object.values(task.participants).filter((participant: ParticipantDetail) => task.assigneeScipers!.includes(participant.sciper))

  assignees = (assignees && assignees.length > 1) ? _.uniqWith(assignees, _.isEqual) : assignees  // make it uniqu if we have multiple roles
  let onHoverInfo = ``

  const currentStepLabel = _.flatten(StepsDefinitionDefault).find((step) => step.id === task!.elementId)
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
  // is this a step depending on a specific field ?
  if (step.dependsOn?.field && !workflowInstanceTasks[0].variables[step.dependsOn.field])
    return <StepFixedContent step={ step }>{ step.dependsOn.contentOnFail }</StepFixedContent>

  // two main cases to manage: this is a step which a task exist, or one without a task
  // get the task concerned by the current step
  const task = workflowInstanceTasks.find(t => t.elementId === step.id)

  if (task) {  // task exists. It can only be a pending then
    return <StepPending step={ step } task={ task }/>
  } else {


    // as there is no task, let's define if we are before the pending(s) (meaning we are 'done') or after (meaning 'not-done')
    const listPendingSteps = workflowInstanceTasks.map(t => t.elementId);

    //TODO: trash this
    // @ts-ignore
    const debugMe = graphlib.json.write(stepDefinition)

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
    // Neither ? -> certainly a sibling / twin / ...
    const siblingEdges = stepDefinition.getSiblings(step.id)

    // check if this is a sibling of a pending
    if (siblingEdges?.some(stepId => listPendingSteps.includes(stepId))) {
      return <StepDone step={ step }/>
    }

    // TODO: for V1 manage dependsOn field
    // TODO: for V2 manage twin cases, multiple IDs per step

    //   // does this need a field to go green ?
    //   if (step.dependsOn?.field && step.dependsOn?.contentOnFail === undefined) {
    //     if (task!.variables[step.dependsOn!.field]) {
    //       return <StepDone step={ step }/>
    //     } else {
    //       return <StepPending step={ step } task={ task! }/>
    //     }
    //   }
    //
    //   // does this need a field to go with a custom content ?
    //   if (step.dependsOn?.field && step.dependsOn?.contentOnFail) {
    //     if (task!.variables[step.dependsOn!.field]) {
    //       return <StepFixedContent step={ step }>{ step.dependsOn!.contentOnFail }</StepFixedContent>
    //     } else {
    //       return <StepPending step={ step } task={ task! }/>
    //     }
    //   }

    return <StepFixedContent step={ step }>Soon</StepFixedContent>
  }
}
