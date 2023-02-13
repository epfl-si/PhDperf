import React from "react";
import {matchPath, useLocation} from "react-router-dom";
import {Breadcrumbs} from "@epfl/epfl-sti-react-library";

export function PhDBreadcrumb() {
  const breadcrumbs = [
    {link: "https://www.epfl.ch/education/phd/", anchor: "Doctoral School"},
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
