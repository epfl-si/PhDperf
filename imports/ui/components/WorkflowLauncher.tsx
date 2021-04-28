import {Meteor} from "meteor/meteor";
import React from 'react'
import { Button } from "epfl-sti-react-library"

export default function WorkflowLauncher() {
  return <Button label={'Initialize a new PhD Assessment process'} onClickFn={() => Meteor.call("launch_workflow")}/>
}
