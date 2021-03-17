import React from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom"
import { Footer } from "epfl-sti-react-library"
import { Hello } from './Hello'
import { Info } from './Info'
import { PhDHeader } from "./components/PhDHeader"
import { PhDBreadcrumbs } from "./components/PhDBreadcrumbs"
import { TaskList } from "./components/TaskList"

export const App = () => (
  <Router>
    <PhDHeader />
    <PhDBreadcrumbs />
    <div className="nav-toggle-layout nav-aside-layout">
      <div className="container">
        <Route exact path="/" component={TaskList} />
      </div>
    </div>
    <Footer />
  </Router>
)
