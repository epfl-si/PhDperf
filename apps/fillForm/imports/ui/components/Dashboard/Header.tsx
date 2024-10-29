import {Meteor} from "meteor/meteor";
import React, {CSSProperties} from "react";

import {DashboardGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";
import {Step} from "phd-assess-meta/types/dashboards";


export const DashboardHeader = (
  { definition, headerKey }:
    { definition: DashboardGraph, headerKey: string }
) => {
  const backgroundColor: CSSProperties = Meteor.settings.public.isTest && !Meteor.settings.public.ignoreTestBackgroundColor ? { backgroundColor: 'Cornsilk' } : { backgroundColor: 'white' }

  return (
    <div
      className="dashboard-title-row row flex-nowrap sticky-top"
      key={ `dashboard_title_row` }
      style={ backgroundColor ?? {} }
    >
      <div className="dashboard-header dashboard-header-phdStudentName col-2 text-black align-self-end">
        Name
      </div>
      <div className="dashboard-header dashboard-header-doctoralProgramName col-1 text-black align-self-end">
        Program
      </div>
      <div className="dashboard-header dashboard-header-launch-date col-1 text-black align-self-end text-center">
        Report launched&nbsp;on
      </div>
      <div className="dashboard-header dashboard-header-dueDate col-1 text-black align-self-end text-center">
        Report due&nbsp;date
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
              >{ step.label }</div>
            })
          }
        </div>
      </div>
      {/*additional div for the edit link*/ }
      <div className={ 'col-1' }>&nbsp;</div>
    </div>
  )
}
