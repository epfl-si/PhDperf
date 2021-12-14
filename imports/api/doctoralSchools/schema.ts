import {Mongo} from "meteor/mongo";
import SimpleSchema from 'simpl-schema';
import {Sciper} from "/imports/api/datatypes";
import persistentDB from "/imports/db/persistent";
import {Meteor} from "meteor/meteor";
import _ from "lodash";

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
      notUnique: "This acronym already exists",
    },
  },
});

DoctoralSchools.schema = new SimpleSchema({
  _id: {type: String, optional: true},
  acronym: {
    type: String, custom: function() {
      /* check for uniqueness on client */
      if (Meteor.isClient && this.isSet) {
        // is the acronym already in ?
        const doctoralSchools = DoctoralSchools.find({acronym: this.value}).fetch() as DoctoralSchool[]
        if (this.isSet && this.field('_id')?.value) {
          // then remove ourself
          _.remove(doctoralSchools, (ds) => ds._id === this.field('_id').value)
        }
        if (doctoralSchools.length) {
          return {name: this.key, type: "notUnique", value: this.value}
        }
      }
    }
  },
  label: {type: String},
  helpUrl: {type: String, optional: true},
  creditsNeeded: {type: Number, optional: true},
  programDirectorSciper: {type: String, optional: true},
});

DoctoralSchools.attachSchema(DoctoralSchools.schema);
