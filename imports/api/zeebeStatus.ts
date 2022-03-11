import { Mongo } from 'meteor/mongo'
import type {ZBClientOptions} from "zeebe-node";
import {ConnectionStatusEvent, ZBClient, ZBWorker} from "zeebe-node";
import {Meteor} from "meteor/meteor";


export type ZeebeStatus = {
  type: "client" | "worker"
  status: keyof typeof ConnectionStatusEvent | "disconnected" | "starting"
}

export const zeebeStatusCollection = new Mongo.Collection<ZeebeStatus>('zeebeStatus', {connection: null})
// Set the initial status
zeebeStatusCollection.upsert({ type: 'client' }, { $set: { status: 'disconnected' } })
zeebeStatusCollection.upsert({ type: 'worker' }, { $set : { status: 'disconnected' } })

// Initial values
export class ZeebeSpreadingClient extends ZBClient {
  constructor(options: ZBClientOptions) {
    zeebeStatusCollection.upsert({ type: 'client' }, { $set: { status: 'starting' }})
    super(options);

    Object.values(ConnectionStatusEvent).forEach((eventName) => {
      this.on(eventName, Meteor.bindEnvironment(() => zeebeStatusCollection.upsert(
        { type: 'client'} , { $set: { status: eventName} }
      )))
    })
  }

  createWorker(...args: any[]): ZBWorker<any, any, any>{
    zeebeStatusCollection.upsert({ type: 'worker' }, { $set : { status: 'starting' } })

    // Sorry, not ts :(
    // @ts-ignore
    let worker = super.createWorker(...args);

    Object.values(ConnectionStatusEvent).forEach((eventName) => {
      worker.on(eventName, Meteor.bindEnvironment(() => zeebeStatusCollection.upsert(
        { type: 'worker' }, { $set : { status: eventName } }
      )))
    })

    return worker;
  }
}

Meteor.publish(
  'zeebe.status', function () { return zeebeStatusCollection.find(); }
)
