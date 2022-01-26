import {Mongo} from "meteor/mongo";
import SimpleSchema from 'simpl-schema';
import {Sciper} from "/imports/api/datatypes";
import persistentDB from "/imports/db/persistent";
import {Meteor} from "meteor/meteor";

export interface DoctoralSchool {
  _id?: string,
  acronym: string,
  label: string,
  helpUrl: string,
  creditsNeeded: number,
  programDirectorSciper: Sciper,
}

export const DoctoralSchools = new Mongo.Collection<DoctoralSchool>('doctoralSchools',
// @ts-ignore
  persistentDB && Meteor.isServer ? { _driver : persistentDB } : {})

SimpleSchema.setDefaultMessages({
  messages: {
    en: {
      notUnique: "This acronym already exists",
    },
  },
});

DoctoralSchools.schema = new SimpleSchema({
  _id: { type: String, optional: true },
  // @ts-ignore
  acronym: { type: String, unique: true },
  label: { type: String },
  helpUrl: { type: String },
  creditsNeeded: { type: SimpleSchema.Integer, min:10, max:99 },
  programDirectorSciper: { type: String, min:6, max:6 },
});

DoctoralSchools.attachSchema(DoctoralSchools.schema);
