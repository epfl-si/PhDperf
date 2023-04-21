import {global_Error, Meteor} from "meteor/meteor";
import React, {useState} from "react";
import toast from 'react-hot-toast';
import {useFind, useSubscribe} from "meteor/react-meteor-data";
import {canStartProcessInstance} from "/imports/policy/tasks";
import {toastErrorClosable} from "/imports/ui/components/Toasters";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {useAccountContext} from "/imports/ui/contexts/Account";

export const WorkflowStarter = () => {
  const account = useAccountContext()

  const isLoading = useSubscribe('doctoralSchools');
  const doctoralSchools = useFind(() => DoctoralSchools.find(), []);

  const [isWaiting, setIsWaiting] = useState(false);

  const toastId = `toast-workflowstarter`

  const callStartWorkflow = async () => {
    setIsWaiting(true)
    try {
      const result = await Meteor.callAsync("startWorkflow", {})
      toast.success(`New workflow instance created (id: ${ result })`)
    } catch (error: any) {
      toastErrorClosable(toastId, `${ error as global_Error | Meteor.Error }`)
    } finally {
      setIsWaiting(false)
    }
  }

  if (isLoading() || !account || !account.user) return <></>

  return (
    <>
      {
        canStartProcessInstance(account.user, doctoralSchools) &&
          <div id={'worklow-actions'} className={'mb-3'}>
            {isWaiting &&
            <button className="btn btn-secondary disabled">
              <i className="fa fa-spinner fa-pulse"/>&nbsp;&nbsp;Creating a new PhD Assessment...
            </button>
            }
            {!isWaiting &&
            <button className="btn btn-secondary" onClick={() => callStartWorkflow()}>
              <i className="fa fa-plus"/>&nbsp;&nbsp;New annual report process
            </button>
            }
          </div>
      }
    </>)
}
