import {Meteor} from "meteor/meteor";
import React, {CSSProperties, useState} from "react";
import SortSpecifier = Mongo.SortSpecifier;
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat"
dayjs.extend(customParseFormat);

import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {Step} from "phd-assess-meta/types/dashboards";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {SortArrow} from "/imports/ui/components/SortingHeader";


type sortedByPossibilities = 'name' |
  'program' |
  'launched_on' |
  'due_date' |
  string  // generic one for the step.id's

type sortedByOrderPossibilities = 'asc' | 'desc'

export const DashboardHeader = (
  { definition, headerKey, setSorting }: {
    definition: DashboardGraph,
    headerKey: string,
    setSorting: ( sortSpecifier: SortSpecifier ) => void
  }
) => {
  const backgroundColor: CSSProperties = Meteor.settings.public.isTest && !Meteor.settings.public.ignoreTestBackgroundColor ? { backgroundColor: 'Cornsilk' } : { backgroundColor: 'white' }

  // keep a trace of the current sort
  const [ sortedBy, setSortedBy ] = useState<sortedByPossibilities>('name')
  const [ sortedByOrder, setSortedByOrder ] = useState<sortedByOrderPossibilities>('asc')

  return (
    <div
      className="dashboard-title-row row flex-nowrap sticky-top"
      key={ `dashboard_title_row` }
      style={ backgroundColor ?? {} }
    >
      <div
        className="dashboard-header dashboard-header-phdStudentName col-2 text-black align-self-end"
        role='button'
      >
        <a onClick={ () => {
          if (sortedBy === 'name') {
            if (sortedByOrder === 'asc') {
              setSorting(
                { sort: {
                  'variables.doctoralProgramName': 1,
                  'variables.phdStudentLastNameUsage': -1,
                  'variables.phdStudentFirstNameUsage': -1
                }}
              );
              setSortedByOrder('desc')
            } else {
              setSorting(
                { sort: {
                  'variables.doctoralProgramName': 1,
                  'variables.phdStudentLastNameUsage': 1,
                  'variables.phdStudentFirstNameUsage': 1
                }}
              );
              setSortedByOrder('asc')
            }
          } else {
            setSorting(
              { sort: {
                'variables.doctoralProgramName': 1,
                'variables.phdStudentLastNameUsage': 1,
                'variables.phdStudentFirstNameUsage': 1
              }}
            );
            setSortedByOrder('asc')
          }
          setSortedBy('name')
        }}>
          Name&nbsp;
          <SortArrow
            direction={
              sortedBy === 'name' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div
        className="dashboard-header dashboard-header-doctoralProgramName col-1 text-black align-self-end text-center"
        role='button'
      >
        <a onClick={ () => {
          if (sortedBy === 'program') {
            if (sortedByOrder === 'asc') {
              setSorting(
                { sort: {
                  'variables.doctoralProgramName': -1,
                  'variables.phdStudentLastNameUsage': 1,
                  'variables.phdStudentFirstNameUsage': 1
                }}
              );
              setSortedByOrder('desc')
            } else {
              setSorting(
                { sort: {
                  'variables.doctoralProgramName': 1,
                  'variables.phdStudentLastNameUsage': 1,
                  'variables.phdStudentFirstNameUsage': 1
                }}
              );
              setSortedByOrder('asc')
            }
          } else {
            setSorting(
              { sort: {
                'variables.doctoralProgramName': 1,
                'variables.phdStudentLastNameUsage': 1,
                'variables.phdStudentFirstNameUsage': 1
              }}
            );
            setSortedByOrder('asc')
          }
          setSortedBy('program')
        }}>
          Program&nbsp;
          <SortArrow
            direction={
              sortedBy === 'program' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div
        className="dashboard-header dashboard-header-launch-date col-1 text-black align-self-end text-center"
        role='button'
      >
        <a onClick={ () => {
          if (sortedBy === 'launched_on') {
            if (sortedByOrder === 'asc') {
              setSorting(
                { sort: { 'variables.created_at': -1 } }
              );
              setSortedByOrder('desc')
            } else {
              setSorting(
                { sort: { 'variables.created_at': 1 } }
              );
              setSortedByOrder('asc')
            }
          } else {
            setSorting(
              { sort: { 'variables.created_at': -1 } }
            );
            setSortedByOrder('desc')
          }
          setSortedBy('launched_on')
        }}>
          Report launched&nbsp;on&nbsp;
          <SortArrow
            direction={
              sortedBy === 'launched_on' ? (
                sortedByOrder === 'asc' ?
                  'desc' : 'asc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div
        className="dashboard-header dashboard-header-dueDate col-1 text-black align-self-end text-center"
        role='button'
      >
        <a onClick={ () => {
          if (sortedBy === 'due_date') {
            if (sortedByOrder === 'asc') {
              setSorting(
                { sort: { 'variables.dueDateDashboard': -1 } }
              );
              setSortedByOrder('desc')
            } else {
              setSorting(
                { sort: { 'variables.dueDateDashboard': 1 } }
              );
              setSortedByOrder('asc')
            }
          } else {
            setSorting(
              { sort: { 'variables.dueDateDashboard': -1 } }
            );
            setSortedByOrder('desc')
          }
          setSortedBy('due_date')
        }}>
          Report due&nbsp;date&nbsp;
          <SortArrow
            direction={
              sortedBy === 'due_date' ? (
                sortedByOrder === 'asc' ?
                  'desc' : 'asc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div className={ 'dashboard-header-steps col align-self-end' }>
        <div className={ 'row' }>
          {
            definition.nodesOrdered().map((node) => {
              const step = definition.node(node) as Step

              // as we are only showing recent entries, we don't need the old steps
              if (step.customContent === "") return <></>

              return <div
                className={
                  'dashboard-header ' +
                  'dashboard-header-step ' +
                  'col ' +
                  'align-self-end ' +
                  'text-small ' +
                  'text-black ' +
                  'text-center '
                }
                key={ `${ headerKey }-${ step.id }` }
              >
                <a onClick={ () => {
                  if (sortedBy === step.id) {
                    if (sortedByOrder === 'asc') {
                      setSorting(
                        {
                          sort: (
                            task1: ITaskDashboard, task2: ITaskDashboard
                          ) => sortByActivityLogsStartedEvent(task1, task2, step, 'desc')
                        }
                      );
                      setSortedByOrder('desc')
                    } else {
                      setSorting(
                        {
                          sort: (
                            task1: ITaskDashboard, task2: ITaskDashboard
                          ) => sortByActivityLogsStartedEvent(task1, task2, step, 'asc')
                        }
                      );
                      setSortedByOrder('asc')
                    }
                  } else {
                    setSorting(
                      {
                        sort: (
                          task1: ITaskDashboard, task2: ITaskDashboard
                        ) => sortByActivityLogsStartedEvent(task1, task2, step, 'desc')
                      }
                    );
                    setSortedByOrder('desc')
                  }
                  setSortedBy(step.id)
                } }>
                  { step.label }&nbsp;
                  <SortArrow
                    direction={
                      sortedBy === step.id ? (
                        sortedByOrder === 'asc' ?
                          'desc' : 'asc'
                      ) : 'neutral'
                    }
                  />
                </a>
              </div>
            })
          }
        </div>
      </div>
      {/*additional div for the edit link*/ }
      <div className={ 'col-1' }>&nbsp;</div>
    </div>
  )
}

const sortByActivityLogsStartedEvent = (
  task1: ITaskDashboard,
  task2: ITaskDashboard,
  step: Step,
  order: sortedByOrderPossibilities
) => {

  const task1Bigger = order === 'asc' ? 1 : -1
  const task2Bigger = order === 'asc' ? -1 : 1

  const allStepIds = [step.id, ...step.knownAs ?? []]

  let task1StartedEvent = task1.activityLogs.find(
    log => log.datetime &&
      allStepIds.includes(log.elementId) &&
      log.event === 'started'
  )

  let task2StartedEvent = task2.activityLogs.find(
    log => (
      log.datetime &&
      allStepIds.includes(log.elementId) &&
      log.event === 'started'
    )
  )

  const task1CompletedEvent = task1.activityLogs.find(
    log => log.datetime &&
      allStepIds.includes(log.elementId) &&
      log.event === 'completed'
  )

  const task2CompletedEvent = task2.activityLogs.find(
    log => log.datetime &&
      allStepIds.includes(log.elementId) &&
      log.event === 'completed'
  )

  // cancel from the sorting process the started ones that are actually completed
  if (task1StartedEvent && task1CompletedEvent) task1StartedEvent = undefined
  if (task2StartedEvent && task2CompletedEvent) task2StartedEvent = undefined

  // First, "the started events" cases
  if (task1StartedEvent?.datetime && task2StartedEvent?.datetime) {
    if (dayjs(task1StartedEvent!.datetime) >
      dayjs(task2StartedEvent!.datetime)) return task1Bigger

    if (dayjs(task1StartedEvent!.datetime) <
      dayjs(task2StartedEvent!.datetime)) return task2Bigger

    if (dayjs(task1StartedEvent!.datetime) ==
      dayjs(task2StartedEvent!.datetime)) return 0
  }

  // then the started for one, none for the other
  if (task1StartedEvent?.datetime && !task2StartedEvent?.datetime) return task1Bigger
  if (!task1StartedEvent?.datetime && task2StartedEvent?.datetime) return task2Bigger

  if (task1CompletedEvent?.datetime && task2CompletedEvent?.datetime) {
    if (dayjs(task1CompletedEvent.datetime) >
      dayjs(task2CompletedEvent.datetime)) return task1Bigger
    if (dayjs(task1CompletedEvent.datetime) <
      dayjs(task2CompletedEvent.datetime)) return task2Bigger
    if (dayjs(task1CompletedEvent.datetime) ==
      dayjs(task2CompletedEvent.datetime)) return 0
  }

  if (task1CompletedEvent?.datetime && !task2CompletedEvent?.datetime) {
    return task1Bigger
  }

  if (!task1CompletedEvent?.datetime && task2CompletedEvent?.datetime) {
    return task2Bigger
  }

  // After that, if the started check failed, test for "the completed events" cases
  if (!task1CompletedEvent?.datetime && !task2CompletedEvent?.datetime) {
    // at this point, without any more information, they can be considerate as even
    return 0
  }

  // for all the other forgotten cases
  return 0
}
