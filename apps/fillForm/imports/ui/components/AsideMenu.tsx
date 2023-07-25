import {Link, matchPath, useLocation} from "react-router-dom";
import React, {useEffect, useState} from "react";

import {Loader} from "@epfl/epfl-sti-react-library";

import {useAccountContext} from "/imports/ui/contexts/Account";
import {canEditAtLeastOneDoctoralSchool} from "/imports/policy/doctoralSchools";
import {canImportScipersFromISA} from "/imports/policy/importScipers";


const DoctoralSchoolHelpLinkMenuEntry = ({ taskId }: {taskId: string }) => {
  const [doctoralSchoolHelpLink, setDoctoralSchoolHelpLink] = useState('')

  useEffect(() => {
    // call the meteor method to get the link for a specific task
    const getLink = async () => {
      const helpLink = await Meteor.callAsync(
      'getDoctoralSchoolHelpLink',
        { taskId }
      )
      setDoctoralSchoolHelpLink(helpLink)
    }
    getLink().catch(console.error)

    return () => setDoctoralSchoolHelpLink('')
  }, [taskId])

  if (!doctoralSchoolHelpLink) return <></>

  return (
    <li>
      <span>Support</span>
      <ul>
        <li>
          <a href={ doctoralSchoolHelpLink } target="_blank">
            Documentation&nbsp;
            <svg className="icon feather" style={ { paddingBottom: 2 } } aria-hidden="true">
              <use xlinkHref="#external-link"></use>
            </svg>
          </a>
        </li>
      </ul>
    </li>
  )
}

export const AsideMenu = () => {
  const account = useAccountContext()
  const { pathname } = useLocation()

  const taskFillingPath = matchPath("/tasks/:id", pathname)

  return (
    <aside className="nav-aside-wrapper">
      <nav id="nav-aside" className="nav-aside sticky-top" role="navigation" aria-describedby="nav-aside-title">
        { (!account || !account.user) ?
          <Loader/> :
          <ul>
            { canEditAtLeastOneDoctoralSchool(account.user) &&
              <li>
                <span className="first-span">Doctoral Programs</span>
                <ul>
                  <li className={matchPath("/doctoral-programs", pathname) ? 'active' : undefined}>
                    <Link to={`/doctoral-programs`}>Administration</Link>
                  </li>
                </ul>
              </li>
            }
            <li>
              <span>Tasks</span>
              <ul>
                <li className={matchPath("/", pathname) ? 'active' : undefined}>
                  <Link to={`/`}>List</Link>
                </li>
                <li className={matchPath("/dashboard", pathname) ? 'active' : undefined}>
                  <Link to={`/dashboard`}>Dashboard</Link>
                </li>
                { canImportScipersFromISA(account.user) &&
                  <li className={matchPath("/import-scipers", pathname) ? 'active' : undefined}>
                    <Link to={`/import-scipers`}>Import scipers</Link>
                  </li>
                }
              </ul>
            </li>
            { taskFillingPath?.params.id &&
              <DoctoralSchoolHelpLinkMenuEntry taskId={ taskFillingPath.params.id }/>
            }
          </ul>
        }
      </nav>
    </aside>
  )
}
