import React from 'react';
import { BrowserRouter as Router, Route, Switch, useParams } from "react-router-dom"
import { Footer } from "epfl-sti-react-library"
import { PhDHeader } from "./components/PhDHeader"
import { PhDBreadcrumbs } from "./components/PhDBreadcrumbs"
import { TaskList } from "./components/TaskList"
import { Task } from "./components/Task"

export const App = () => (
  <Router>
    <PhDHeader />
    <PhDBreadcrumbs />
    <div className="nav-toggle-layout nav-aside-layout">
      <div className="container">
      <Switch>
        <Route exact path="/">
          <TaskList/>
        </Route>
        <Route path="/tasks/:key">
          <TheTask/>
        </Route>
      </Switch>
      </div>
    </div>
    <Footer />
  </Router>
)

function TheTask() {
  const { key } = useParams<{key: string}>()
  return <Task workflowKey={key}/>
}
