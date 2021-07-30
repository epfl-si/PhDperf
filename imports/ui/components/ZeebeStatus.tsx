import React from 'react'
import {Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {zeebeStatusCollection} from "/imports/ui/model/zeebeStatus";

export function ZeebeStatus() {
  const zeebeStatusLoading = useTracker(() => {
    const handle = Meteor.subscribe('zeebe.status')
    return !handle.ready()
  }, [])

  const allZeebeStatus:any = useTracker(
    () => zeebeStatusCollection.find().fetch().reverse()
  )

  const zeebeStatus = allZeebeStatus[0]

  return (
    <div className={'d-flex flex-row-reverse small mr-3 mt-1'}>
      <div>
        <span>Zeebe status:</span>&nbsp;
        <span className="font-weight-bold">
          {zeebeStatusLoading ? (
            'waiting on server'
          ) : (
            zeebeStatus ? zeebeStatus.status : 'no status provided'
          )
          }
        </span>
      </div>
    </div>
  )
}
