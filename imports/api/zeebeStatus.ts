import { Mongo } from 'meteor/mongo'
import type {ZBClientOptions} from "zeebe-node";
import {ZBClient, ZBWorker} from "zeebe-node";
import {Meteor} from "meteor/meteor";

export type ZeebeStatus = {
  type: string
  status: string
}

export const zeebeStatusCollection = new Mongo.Collection<ZeebeStatus>('zeebeStatus', {connection: null})
zeebeStatusCollection.insert({type: 'client', status: 'disconnected'})
zeebeStatusCollection.insert({type: 'worker', status: 'disconnected'})

// Initial values
export class ZeebeSpreadingClient extends ZBClient {
  constructor(options: ZBClientOptions) {
    zeebeStatusCollection.insert({type: 'client', status: 'starting'})
    super(options);

    // TODO: make subscribe to event generic
    this.on('ready', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'client', status: 'ready'})))
    this.on('close', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'client', status: 'closed'})))
    this.on('connectionError', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'client', status: 'error'})))
    this.on('unknown', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'client', status: 'unknown'})))
  }

  createWorker(...args: any[]): ZBWorker<any, any, any>{
    zeebeStatusCollection.insert({type: 'worker', status: 'starting'})

    // Sorry, not ts :(
    // @ts-ignore
    let worker = super.createWorker(...args);

    // TODO: make subscribe to event generic
    worker.on('ready', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'worker', status: 'ready'})))
    worker.on('close', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'worker', status: 'closed'})))
    worker.on('connectionError', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'worker', status: 'error'})))
    worker.on('unknown', Meteor.bindEnvironment(() => zeebeStatusCollection.insert({type: 'worker', status: 'unknown'})))

    return worker;
  }
}

Meteor.publish(
  'zeebe.status', function () { return zeebeStatusCollection.find(); }
)
