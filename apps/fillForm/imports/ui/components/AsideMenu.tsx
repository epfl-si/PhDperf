import {Link, matchPath, useLocation} from "react-router-dom";
import React from "react";

import {Loader} from "@epfl/epfl-sti-react-library";

import {useAccountContext} from "/imports/ui/contexts/Account";
import {canEditAtLeastOneDoctoralSchool} from "/imports/policy/doctoralSchools";
import {canImportScipersFromISA} from "/imports/policy/importScipers";


export const AsideMenu = () => {
  const account = useAccountContext()
  const { pathname } = useLocation()

  const hasDoctoralSchoolEditLink = (account && account.user && canEditAtLeastOneDoctoralSchool(account.user)) ?? false
  const hasImportSciperLink = (account && account.user && canImportScipersFromISA(account.user)) ?? false

  return (
    <aside className="nav-aside-wrapper">
      { (!account || !account.user) ?
        <Loader/> :
        <nav id="nav-aside" className="nav-aside sticky-top" role="navigation" aria-describedby="nav-aside-title">
          <ul>
            { ( hasDoctoralSchoolEditLink || hasImportSciperLink ) &&
              <li>
                <span className="first-span">Administration</span>
                { hasDoctoralSchoolEditLink &&
                  <ul>
                    <li className={matchPath("/doctoral-programs", pathname) ? 'active' : undefined}>
                      <Link to={`/doctoral-programs`}>Doctoral program settings</Link>
                    </li>
                  </ul>
                }
                { hasImportSciperLink &&
                  <ul>
                    <li className={matchPath("/import-scipers", pathname) ? 'active' : undefined}>
                      <Link to={`/import-scipers`}>Import scipers</Link>
                    </li>
                  </ul>
                }
              </li>
            }
            <li className={matchPath("/", pathname) ? 'active' : undefined}>
              <Link to={`/`}>Tasks to do</Link>
            </li>
            <li className={matchPath("/dashboard", pathname) ? 'active' : undefined}>
              <Link to={`/dashboard`}>Dashboard</Link>
            </li>
            <li>
              <a href={ 'https://www.epfl.ch/education/phd/annual_report' } target="_blank">
                User manual&nbsp;
                <svg className="icon feather" style={ { paddingBottom: 2 } } aria-hidden="true">
                  <use xlinkHref="#external-link"></use>
                </svg>
              </a>
            </li>
          </ul>
        </nav>
      }
    </aside>
  )
}
