import {Mongo} from "meteor/mongo";
import SimpleSchema from 'simpl-schema';
import {Sciper} from "/imports/api/datatypes";
import persistentDB from "/imports/db/persistent";
import {Meteor} from "meteor/meteor";

export interface DoctoralSchool {
  _id?: string,
  acronym: string,
  label: string,
  helpUrl?: string,
  creditsNeeded?: number,
  programDirectorSciper?: Sciper,
}

export const DoctoralSchools = new Mongo.Collection('doctoralSchools',
// @ts-ignore
  persistentDB && Meteor.isServer ? { _driver : persistentDB } : {})

SimpleSchema.setDefaultMessages({
  messages: {
    en: {
      notUnique: "This acronym should not already exists",
    },
  },
});

DoctoralSchools.schema = new SimpleSchema({
  _id: {type: String, optional: true},
  acronym: {type: String, custom: function() {
      if (!this.isModifier && DoctoralSchools.findOne({ acronym: this.value})) {
        return {name: this.key, type: "notUnique", value: this.value}
      }
    }
  },
  label: {type: String},
  helpUrl: {type: String, optional: true},
  creditsNeeded: {type: Number, optional: true},
  programDirectorSciper: {type: String, optional: true},
});

DoctoralSchools.attachSchema(DoctoralSchools.schema);
