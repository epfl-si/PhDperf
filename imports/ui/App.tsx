import React from 'react';
import {
  BrowserRouter, RouteProps, Route, Switch,
  useParams, useRouteMatch
} from "react-router-dom"
import {FooterLight} from "epfl-sti-react-library"
import {PhDHeader} from "./components/PhDHeader"
import {Breadcrumbs} from "epfl-sti-react-library"
import TaskList from "./components/TaskList"
import {Task} from "./components/Task"
import {ZeebeStatus} from "/imports/ui/components/ZeebeStatus"
import {Toaster} from "react-hot-toast";

const PageRoute: React.FC<RouteProps> = (props) => (
  <Route {...props}>
    <PhDHeader/>
    <PhDBreadcrumbs/>
    <div className="nav-toggle-layout nav-aside-layout">
      <div className="container">
        {props.children}
      </div>
    </div>
    <ZeebeStatus/>
    <FooterLight/>
  </Route>
)


export const App = () => {
  return (
    <BrowserRouter>
      <Toaster/>
      <Switch>
        <PageRoute path="/tasks/:key">
          <TheTask/>
        </PageRoute>
        <PageRoute path="/">
          <h1 className={'h2'}>PhD Assess</h1>
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
    {link: "/", anchor: "PhDperf"}
  ]

  const {path} = useRouteMatch()
  if (path.includes("/tasks/")) {
    // TODO: here, too
    breadcrumbs.push({link: "/", anchor: "Tasks"})
  }

  return <Breadcrumbs items={breadcrumbs}/>
}
