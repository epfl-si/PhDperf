import React from "react"
import { Header } from "epfl-sti-react-library"

export class PhDHeader extends React.Component {
  getMenuItems = () => {
    return [
      { link: "https://www.epfl.ch/about/", anchor: "About" },
      { link: "https://www.epfl.ch/education", anchor: "Education" },
      { link: "https://www.epfl.ch/research", anchor: "Research" },
      { link: "https://www.epfl.ch/innovation/", anchor: "Innovation" },
      { link: "https://www.epfl.ch/schools/", anchor: "Schools" },
      { link: "https://www.epfl.ch/campus/", anchor: "Campus", active: true },
    ];
  };

  getMenuDrawerContents = () => {
    return { link: "https://www.epfl.ch", anchor: "Go to main site" };
  };

  render() {
    return (
      <Header
        topMenuItems={this.getMenuItems()}
        drawerContents={this.getMenuDrawerContents()}
      />
    );
  }
}
