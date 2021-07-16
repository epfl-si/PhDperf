import {Meteor} from "meteor/meteor";
import React, {useState} from "react";
import toast from 'react-hot-toast';

const notify = (message: string) => toast(message);

export const WorkflowStarter = () => {
  const [isWaiting, setIsWaiting] = useState(false);

  const onClick = () => {
    setIsWaiting(true)
    Meteor.call(
      "start_workflow", (error: any) => {
        if (error) {
          notify(`Error: ${error}`)
        }
        notify(`New workflow instance created`)
        setIsWaiting(false)
      }
    )
  };

  return (
    <div id={'worklow-actions'} className={'mb-4'}>
      {isWaiting &&
      <button className="btn btn-secondary disabled">
        <i className="fa fa-spinner fa-pulse"/>&nbsp;&nbsp;Creating a new PhD Assessment...
      </button>
      }
      {!isWaiting &&
      <button className="btn btn-secondary" onClick={() => onClick()}>
        <i className="fa fa-plus"/>&nbsp;&nbsp;New PhD Assessment
      </button>
      }
    </div>
  )
}
