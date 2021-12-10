import {Link} from "react-router-dom";
import React from "react";

export const AsideMenu = () => (
  <aside className="nav-aside-wrapper">
    <nav id="nav-aside" className="nav-aside" role="navigation" aria-describedby="nav-aside-title">
      <ul>
        <li>
          <a href="#">
            Doctoral Schools
          </a>
          <ul>
            <li className={`/doctoral-schools` === document.location.pathname ? 'active' : undefined }><Link to={`/doctoral-schools`}>Administration</Link></li>
          </ul>
        </li>
        <li>
          <a href="#">
            Tasks
          </a>
          <ul>
            <li className={`/` === document.location.pathname ? 'active' : undefined }><Link to={`/`}>List</Link></li>
            <li className={`/dashboard` === document.location.pathname ? 'active' : undefined }><Link to={`/dashboard`}>Dashboard</Link></li>
          </ul>
        </li>
      </ul>
    </nav>
  </aside>
)
