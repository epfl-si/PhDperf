import {global_Error, Meteor} from "meteor/meteor";
import React, {useState} from "react";
import toast from 'react-hot-toast';
import {useFind, useSubscribe} from "meteor/react-meteor-data";
import {canStartProcessInstance} from "/imports/policy/processInstance";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {useAccountContext} from "/imports/ui/contexts/Account";

export const WorkflowStarter = () => {
  const account = useAccountContext()

  const isLoading = useSubscribe('doctoralSchools');
  const doctoralSchools = useFind(() => DoctoralSchools.find(), []);

  const [isWaiting, setIsWaiting] = useState(false);

  const callStartWorkflow = async () => {
    setIsWaiting(true)

    await toast.promise(
      Meteor.callAsync("startWorkflow", {}),
      {
        loading: 'Creating a new PhD Assessment...',
        success: () => {
          setIsWaiting(false)
          return `New workflow created`
        },
        error: (error) => {
          setIsWaiting(false)
          return `${ error as global_Error | Meteor.Error }`
        },
      },
      {
        style: {
          minWidth: '280px',
        },
      }
    );
  }

  const isReady = !(isLoading() || !account || !account.user)

  return (
    <div id={ 'workflow-actions' } className={ 'mb-3' }>
      { !isReady && <></> }
      { isReady &&
        canStartProcessInstance(account!.user!, doctoralSchools) &&
          <>
          { isWaiting &&
              <button className="btn btn-secondary disabled">
                  <i className="fa fa-spinner fa-pulse"/>&nbsp;&nbsp;Creating a new PhD Assessment...
              </button>
          }
          { !isWaiting &&
              <button className="btn btn-secondary" onClick={ callStartWorkflow }>
                  <i className="fa fa-plus"/>&nbsp;&nbsp;New annual report process
              </button>
          }
        </>
    }
    </div>)
}
