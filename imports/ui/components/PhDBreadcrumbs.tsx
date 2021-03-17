import React from "react"
import { Breadcrumbs } from "epfl-sti-react-library"

export class PhDBreadcrumbs extends React.Component {
  getBreadcrumbsItems = () => {
    return [
      { link: "https://www.epfl.ch/campus/", anchor: "Campus" },
    ]
  }

  render() {
    return <Breadcrumbs items={this.getBreadcrumbsItems()} />
  }
}
