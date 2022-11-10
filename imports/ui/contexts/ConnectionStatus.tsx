/**
 * Provide a reactive context for user info
 */
import {Meteor} from "meteor/meteor";
import React, {useContext} from 'react'
import {createContext} from "react";
import {useTracker} from 'meteor/react-meteor-data'
import DDPStatus = DDP.DDPStatus;

import {ZeebeStatus} from "/imports/api/zeebeStatus";


// a mix between how the server is going with its link with Zeebe and the client to Meteor server
type ConnectionStatus = {
  zeebe?: ZeebeStatus  // WIP
  ddp: DDPStatus
}

const useConnectionStatus = () => useTracker(() => {
  const ddpStatus = Meteor.status()
  let zeebeStatus: ZeebeStatus | undefined = undefined  // WIP

  return {
    ddp: ddpStatus,
    zeebe: zeebeStatus
  } as ConnectionStatus
}, [])

export const ConnectionStatusContext = createContext<ConnectionStatus>({
  ddp: { connected: false, retryCount: 0, status: "offline" },
  zeebe: { type: "client", status: "unknown" }
})

export const ConnectionStatusProvider = (props: any) => (
  <ConnectionStatusContext.Provider value={useConnectionStatus()}>
    {props.children}
  </ConnectionStatusContext.Provider>
)

export const useConnectionStatusContext = () => useContext(ConnectionStatusContext)
