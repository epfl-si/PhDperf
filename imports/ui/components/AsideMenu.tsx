import {Link, matchPath, useLocation} from "react-router-dom";
import React from "react";

export const AsideMenu = () => {
  const { pathname } = useLocation()

  return (
    <aside className="nav-aside-wrapper">
      <nav id="nav-aside" className="nav-aside" role="navigation" aria-describedby="nav-aside-title">
        <ul>
          <li>
            <a href="#">
              Doctoral Schools
            </a>
            <ul>
              <li className={matchPath("/doctoral-schools", pathname) ? 'active' : undefined }><Link to={`/doctoral-schools`}>Administration</Link></li>
            </ul>
          </li>
          <li>
            <a href="#">
              Tasks
            </a>
            <ul>
              <li className={matchPath("/", pathname) ? 'active' : undefined }><Link to={`/`}>List</Link></li>
              <li className={matchPath("/dashboard", pathname) ? 'active' : undefined }><Link to={`/dashboard`}>Dashboard</Link></li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
