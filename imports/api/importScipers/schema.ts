import {Mongo} from "meteor/mongo";
import SimpleSchema from 'simpl-schema';
import {Meteor} from "meteor/meteor";
import ephemeralDB from "/imports/db/ephemeral";
import {DoctorantInfo} from "/imports/api/importScipers/isaTypes";


export interface DoctorantInfoSelectable extends DoctorantInfo {
  isSelected: boolean
}

export interface ImportScipersList {
  _id?: string,
  doctoralSchoolAcronym: string,
  doctorants?: DoctorantInfo[],
  createdAt?: Date,
  createdBy: string,
}

export const ImportScipersList = new Mongo.Collection<ImportScipersList>('importScipersList',
// @ts-ignore
  ephemeralDB && Meteor.isServer ? { _driver : ephemeralDB } : {})

const PersonSchema = new SimpleSchema({
  sciper: { type: String },
  fullName: { type: String },
  email: { type: String },
  },
  { requiredByDefault: false },
)

const ThesisSchema = new SimpleSchema({
  mentor: { type: PersonSchema },
  directeur: { type: PersonSchema },
  coDirecteur: { type: PersonSchema },
  dateAdmThese: { type: String }, // "12.10.2020"
  },
  { requiredByDefault: false },
)

const doctorantSchema = new SimpleSchema({
  doctorant: { type: PersonSchema },
  isSelected: { type: Boolean, defaultValue: false },
  thesis: { type: ThesisSchema },
  dateImmatriculation: { type: String },   //"01.09.2019"
  dateExamCandidature: { type: String },   //"03.08.2020"
})

ImportScipersList.schema = new SimpleSchema({
  _id: { type: String, optional: true },
  doctoralSchoolAcronym: { type: String },
  doctorants: {type: Array, optional: true},
  "doctorants.$": { type: doctorantSchema },
  createdAt: { type: Date, optional: true, autoValue: () => new Date() },
  createdBy: { type: String, optional: true},
});

ImportScipersList.attachSchema(ImportScipersList.schema);
