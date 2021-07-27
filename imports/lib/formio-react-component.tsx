import {render} from "react-dom";
import React from "react";

export function reactToFormIO (Component: React.ComponentType) {
  return (ctx: any) => {
    let divCounter = 0

    function newDivID() {
      divCounter += 1
      return `mini-react-component-${divCounter}`
    }

    const divID = newDivID()
    // !! set a better way to call this
    setTimeout(() => {
      render(<Component ctx={ctx}/>, document.getElementById(divID))
    }, 1000);  // XXX
    return `<div id="${divID}"></div>`
  }
}

//rename imports/lib/formIOUtils.tsx to ts ?
