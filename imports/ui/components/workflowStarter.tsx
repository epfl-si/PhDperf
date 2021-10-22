import {global_Error, Meteor} from "meteor/meteor";
import React, {useState} from "react";
import toast from 'react-hot-toast';

export const WorkflowStarter = () => {
  const [isWaiting, setIsWaiting] = useState(false);

  const onClick = () => {
    setIsWaiting(true)
    Meteor.call(
      "startWorkflow",  {}, (error: global_Error | Meteor.Error | undefined, result: any) => {
        if (error) {
          toast.error(`${error}`)
        } else {
          toast.success(`New workflow instance created (id: ${result})`)
        }
        setIsWaiting(false)
      }
    )
  }

  return (
    <div id={'worklow-actions'} className={'mb-4'}>
      {isWaiting &&
      <button className="btn btn-secondary disabled">
        <i className="fa fa-spinner fa-pulse"/>&nbsp;&nbsp;Creating a new PhD Assessment...
      </button>
      }
      {!isWaiting &&
      <button className="btn btn-secondary" onClick={() => onClick()}>
        <i className="fa fa-plus"/>&nbsp;&nbsp;New annual report process
      </button>
      }
    </div>
  )
}
