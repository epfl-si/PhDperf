import {Meteor} from "meteor/meteor";
import React, {CSSProperties} from "react";
import {Outlet, useRouteError} from "react-router-dom";
import {FooterLight} from "@epfl/epfl-sti-react-library"

import {ToasterConfig} from "/imports/ui/components/Toasters";
import {PhDHeader} from "/imports/ui/components/PhDHeader";
import {PhDBreadcrumb} from "/imports/ui/components/Breadcrumb";
import {AsideMenu} from "/imports/ui/components/AsideMenu";
import {ConnectionStatusFooter} from "/imports/ui/components/ConnectionStatus";

/**
 * The base UI for all pages, where other pages are rendered into
 */
export default function Main() {
  const mainPanelBackgroundColor: CSSProperties = Meteor.settings.public.isTest ? {backgroundColor: 'Cornsilk'} : {}

  const error:any = useRouteError();

  return (
    <>
      <ToasterConfig/>
      <PhDHeader/>
      <PhDBreadcrumb/>
      <div className={ 'main nav-toggle-layout nav-aside-layout' }>
        <AsideMenu/>
        <div className="container" style={ mainPanelBackgroundColor }>
          { Meteor.settings.public.isTest &&
            <div className={'alert alert-info'} role={'alert'}><strong>Testing</strong> You are on the testing environment.</div>
          }
          { error ?
            <div id="error-page">
              <h2>Oops!</h2>
              <p>Sorry, an unexpected error has occurred.</p>
              <p>
                {error.statusText || error.message}
              </p>
            </div>
            :
            <Outlet/>
          }
        </div>
      </div>
      <ConnectionStatusFooter/>
      <FooterLight/>
    </>
  )
}
