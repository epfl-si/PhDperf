import {global_Error, Meteor} from "meteor/meteor";
import React, {useState} from "react";
import toast from 'react-hot-toast';
import {useTracker} from "meteor/react-meteor-data";
import {canStartProcessInstance} from "/imports/policy/tasks";
import {toastClosable} from "/imports/ui/components/Toasters";
import {ErrorIcon} from "react-hot-toast/src/components/error";

export const WorkflowStarter = () => {
  const userLoaded = !!useTracker(() => {
    return Meteor.user();
  }, []);

  const [isWaiting, setIsWaiting] = useState(false);

  const toastId = `toast-workflowstarter`

  const onClick = () => {
    setIsWaiting(true)
    Meteor.call(
      "startWorkflow",  {}, (error: global_Error | Meteor.Error | undefined, result: any) => {
        if (error) {
          toast(
            toastClosable(toastId, `${error}`),
            {
              id: toastId,
              duration: Infinity,
              icon: <ErrorIcon />,
            }
          )
        } else {
          toast.success(`New workflow instance created (id: ${result})`)
        }
        setIsWaiting(false)
      }
    )
  }

  return (
    <>
      {userLoaded && canStartProcessInstance() &&
      <div id={'worklow-actions'} className={'mb-3'}>
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
      }
    </>)
}
