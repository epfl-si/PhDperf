import { Mongo } from 'meteor/mongo'
import type {ZBClientOptions} from "zeebe-node";
import {ConnectionStatusEvent, ZBClient, ZBWorker} from "zeebe-node";
import {Meteor} from "meteor/meteor";


export type ZeebeStatus = {
  type: "client" | "worker"
  status: keyof typeof ConnectionStatusEvent | "disconnected" | "starting"
}

export const zeebeStatusCollection = new Mongo.Collection<ZeebeStatus>('zeebeStatus', {connection: null})
zeebeStatusCollection.insert({type: 'client', status: 'disconnected'})
zeebeStatusCollection.insert({type: 'worker', status: 'disconnected'})

// Initial values
export class ZeebeSpreadingClient extends ZBClient {
  constructor(options: ZBClientOptions) {
    zeebeStatusCollection.insert({type: 'client', status: 'starting'})
    super(options);

    Object.values(ConnectionStatusEvent).forEach((eventName) => {
      this.on(eventName, Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'client', status: eventName})))
    })
  }

  createWorker(...args: any[]): ZBWorker<any, any, any>{
    zeebeStatusCollection.insert({type: 'worker', status: 'starting'})

    // Sorry, not ts :(
    // @ts-ignore
    let worker = super.createWorker(...args);

    Object.values(ConnectionStatusEvent).forEach((eventName) => {
      worker.on(eventName, Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'worker', status: eventName})))
    })

    return worker;
  }
}

Meteor.publish(
  'zeebe.status', function () { return zeebeStatusCollection.find(); }
)
