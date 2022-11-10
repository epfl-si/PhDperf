import React, {CSSProperties} from 'react';
import {
  BrowserRouter, useLocation, matchPath
} from "react-router-dom"
import {Meteor} from "meteor/meteor";

import {FooterLight, Breadcrumbs} from "@epfl/epfl-sti-react-library"
import {Toaster} from "react-hot-toast";

import {PhDHeader} from "./components/PhDHeader"
import {AsideMenu} from "/imports/ui/components/AsideMenu";
import {AccountProvider} from "/imports/ui/contexts/Account";
import {PhDRoutes} from "/imports/ui/routes";
import {ConnectionStatusFooter} from "/imports/ui/components/ConnectionStatus";
import {ConnectionStatusProvider} from "/imports/ui/contexts/ConnectionStatus";


export const App = () => {
  const mainPanelBackgroundColor: CSSProperties = Meteor.settings.public.isTest ? { backgroundColor: 'Cornsilk'} : {}

  return (
    <ConnectionStatusProvider>
      <AccountProvider>
        <BrowserRouter>
          <Toaster
            toastOptions={{
              // Define default options
              duration: 5000,
              // Default options for specific types
              success: {
                duration: 4000,
              },
            }}
          />
          <PhDHeader/>
          <PhDBreadcrumbs/>
          <div className={ 'nav-toggle-layout nav-aside-layout' }>
            <AsideMenu/>
            <div className="container" style={ mainPanelBackgroundColor }>
              { Meteor.settings.public.isTest &&
                <div className={'alert alert-info'} role={'alert'}><strong>Testing</strong> You are on the testing environment.</div>
              }
              <PhDRoutes/>
            </div>
          </div>
          <ConnectionStatusFooter/>
          <FooterLight/>
        </BrowserRouter>
      </AccountProvider>
    </ConnectionStatusProvider>
  )
}

function PhDBreadcrumbs() {
  const breadcrumbs = [
    {link: "https://www.epfl.ch/education/phd/", anchor: "Doctoral School"},
    // TODO: We should fashion this out of a <Link>
    {link: "/", anchor: "Annual Report"}
  ]

  const { pathname } = useLocation()

  matchPath("/", pathname) && breadcrumbs.push({link: "/", anchor: "Tasks list"})
  matchPath("tasks/*", pathname) && breadcrumbs.push({link: "/", anchor: "Tasks"}) &&  breadcrumbs.push({link: pathname, anchor: "Proceeding"})
  matchPath("/dashboard", pathname) && breadcrumbs.push({link: "/dashboard", anchor: "Tasks dashboard"})
  matchPath("/doctoral-programs", pathname) && breadcrumbs.push({link: "/doctoral-programs", anchor: "Doctoral programs administration"})
  matchPath("/import-scipers", pathname) && breadcrumbs.push({link: "/import-scipers", anchor: "Import scipers"})
  return <Breadcrumbs items={breadcrumbs}/>
}
