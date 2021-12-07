import React, {CSSProperties} from 'react';
import {
  BrowserRouter, RouteProps, Route, Switch,
  useParams, useRouteMatch
} from "react-router-dom"
import {FooterLight, Breadcrumbs} from "@epfl/epfl-sti-react-library"
import {PhDHeader} from "./components/PhDHeader"
import TaskList from "./components/TaskList"
import {Task} from "./components/Task"
import {ZeebeStatus} from "/imports/ui/components/ZeebeStatus"
import {Toaster} from "react-hot-toast";
import {DoctoralSchoolsForm} from "/imports/ui/components/DoctoralSchools/form";
import {Dashboard} from "/imports/ui/components/Dashboard";
import {useTracker} from "meteor/react-meteor-data";
import {Meteor} from "meteor/meteor";
import {canAccessDashboard} from "/imports/policy/tasks";
import {AsideMenu} from "/imports/ui/components/AsideMenu";


const PageRoute: React.FC<RouteProps> = (props) => {
  const userLoaded = useTracker(() => {
    return Meteor.user();
  }, []);

  const mainPanelBackgroundColor: CSSProperties = Meteor.settings.public.isTest ? { backgroundColor: 'Cornsilk'} : {}

  return (
    <Route {...props}>
      <PhDHeader/>
      <PhDBreadcrumbs/>

      <div className={ 'nav-toggle-layout nav-aside-layout' }>
        {userLoaded && canAccessDashboard() &&
        <AsideMenu/>
        }
        <div className="container" style={ mainPanelBackgroundColor }>
          { Meteor.settings.public.isTest &&
          <div className={'alert alert-info'} role={'alert'}><strong>Testing</strong> You are on the testing environment.</div>
          }
          {props.children}
        </div>
      </div>
      <ZeebeStatus/>
      <FooterLight/>
    </Route>
  )
}

export const App = () => {
  return (
    <BrowserRouter>
      <Toaster/>
      <Switch>
          <PageRoute path="/doctoral-schools">
              <DoctoralSchoolsForm/>
          </PageRoute>
        <PageRoute path="/dashboard">
          <Dashboard/>
        </PageRoute>
        <PageRoute path="/tasks/:key">
          <TheTask/>
        </PageRoute>
        <PageRoute path="/">
          <TaskList/>
        </PageRoute>
      </Switch>
    </BrowserRouter>
  );
}

function TheTask() {
  const {key} = useParams<{ key: string }>()
  return <Task workflowKey={key}/>
}

function PhDBreadcrumbs() {
  const breadcrumbs = [
    {link: "https://www.epfl.ch/education/phd/", anchor: "École Doctorale"},
    // TODO: We should fashion this out of a <Link>
    {link: "/", anchor: "Annual Report"}
  ]

  const {path} = useRouteMatch()
  if (path.includes("/tasks/")) {
    // TODO: here, too
    breadcrumbs.push({link: "/", anchor: "Tasks"})
  }

  return <Breadcrumbs items={breadcrumbs}/>
}
