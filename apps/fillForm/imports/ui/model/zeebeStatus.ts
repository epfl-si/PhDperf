import { Mongo } from 'meteor/mongo'

export const zeebeStatusCollection = new Mongo.Collection('zeebeStatus');
