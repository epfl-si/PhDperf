import React from "react";
import {assert} from "chai";
import {render} from '@testing-library/react'

import {Tasks} from "/imports/model/tasks";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {StepsDefinition} from "phd-assess-meta/types/dashboards";

import {
  StepsDefinitionDefault,
  StepsDefinitionV2
} from "/imports/ui/components/Dashboard/DefaultDefinition";
import {convertDefinitionToGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {DashboardContent} from "/imports/ui/components/Dashboard/Dashboard";


/*
 * Create the Dashboard and do basic assertions
 */
export const getAndCheckDashboardContainer = (tasks: ITaskDashboard[], dashboardDefinition: StepsDefinition) => {
  const definitionGraph = convertDefinitionToGraph(dashboardDefinition)

  const { container } = render(
    <DashboardContent
      key={ Object.keys({stepsDefinitionDefault: StepsDefinitionDefault})[0] }
      headerKey={ Object.keys({stepsDefinitionDefault: StepsDefinitionDefault})[0] }
      definitionForHeader={ definitionGraph }
      tasks={ tasks }
    />
  );

  const dashboard = container.querySelector(`.dashboard`)
  assert.exists(dashboard, `${ container.innerHTML }`)

  // empty dashboard please not
  assert.isAbove(
    container.querySelectorAll(`.row:not(.dashboard-title)`).length,
    0
  )

  return container
}

/*
 * Get a dashboard container for V1
 */
export const getContainerV1 = async () => {
  const allProcessInstanceTasks =
    await Tasks.find({'variables.dashboardDefinition': { $exists:false }}).fetchAsync() as ITaskDashboard[]

  assert.isNotEmpty(allProcessInstanceTasks, `${JSON.stringify(allProcessInstanceTasks)}`)

  return getAndCheckDashboardContainer(allProcessInstanceTasks, StepsDefinitionDefault)
}

/*
 * Get a dashboard container for V2
 */
export const getContainerV2 = async () => {
  const allProcessInstanceTasks =
    await Tasks.find({'variables.dashboardDefinition': { $exists:true }}).fetchAsync() as ITaskDashboard[]

  assert.isNotEmpty(allProcessInstanceTasks, `${JSON.stringify(allProcessInstanceTasks)}`)

  return getAndCheckDashboardContainer(allProcessInstanceTasks, StepsDefinitionV2)
}
