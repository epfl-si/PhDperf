import React from 'react'
import {Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data'
import {zeebeStatusCollection} from "/imports/ui/model/zeebeStatus";


/**
 * Allow to control the client connexion.
 */
const ClientConnectionController = () => {
  const status = useTracker(() => {
    return Meteor.status()
  })

  return (
    <div className={'mx-2'}>
      <span>Client status:</span>&nbsp;
      <span className="">
          { JSON.stringify(status, null, ' ') }
        </span>
      <button className={'mx-1'} onClick={() => Meteor.reconnect()}>Reconnect</button>
      <button className={'mx-1'} onClick={() => Meteor.disconnect()}>Disconnect</button>
    </div>
  )
}

/**
 * Here are shown information coming from
 *   1. the  client connection to Meteor (aka Meteor.status())
 *   2. the server connection to Zeebe (crawled from the 'zeebe.status' table, updated by the server)
 * If one or another fail, it may be bad, so we notify it
 */
export function ConnectionStatusFooter() {
  const zeebeStatusLoading = useTracker(() => {
    const handle = Meteor.subscribe('zeebe.status')
    return !handle.ready()
  })

  const allZeebeStatus:any = useTracker(
    () => zeebeStatusCollection.find().fetch().reverse()
  )

  const zeebeStatus = allZeebeStatus[0]

  return (
    <div className={'d-flex flex-row-reverse small mr-3 mt-4'}>
      <div className={'pl-1'}>
        <span>Server status:</span>&nbsp;
        <span className="font-weight-bold">
          {zeebeStatusLoading ? (
            'waiting on server'
          ) : (
            zeebeStatus ? zeebeStatus.status : 'no status provided'
          )
          }
        </span>
      </div>
      { Meteor.settings.public.showClientConnexionControl &&
        <ClientConnectionController/>
      }
    </div>
  )
}
