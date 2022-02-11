import {Mongo} from "meteor/mongo";
import SimpleSchema from 'simpl-schema';
import {Meteor} from "meteor/meteor";
import ephemeralDB from "/imports/db/ephemeral";
import {DoctorantInfo} from "/imports/api/importScipers/isaTypes";


export interface DoctorantInfoSelectable extends DoctorantInfo {
  isSelected: boolean
  needCoDirectorData?: boolean
  hasAlreadyStarted?: boolean
  isBeingImported?: boolean
}

export interface ImportScipersList {
  _id?: string,
  doctoralSchoolAcronym: string,
  doctorants?: DoctorantInfoSelectable[],
  createdAt?: Date,
  createdBy: string,
  isAllSelected: boolean,
}

class ImportScipersListCollection extends Mongo.Collection<ImportScipersList> {
}

export const ImportScipersList = new ImportScipersListCollection('importScipersList',
// @ts-ignore
  ephemeralDB && Meteor.isServer ? { _driver : ephemeralDB } : {})

/*
 * Schema definitions
 */
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
  isSelected: { type: Boolean, defaultValue: false },
  needCoDirectorData: { type: Boolean, optional: true},
  hasAlreadyStarted: { type: Boolean, optional: true},
  isBeingImported: { type: Boolean, optional: true},
  doctorant: { type: PersonSchema },
  thesis: { type: ThesisSchema },
  dateImmatriculation: { type: String },   //"01.09.2019"
  dateExamCandidature: { type: String },   //"03.08.2020"
})

ImportScipersList.schema = new SimpleSchema({
  _id: { type: String, optional: true },
  doctoralSchoolAcronym: { type: String },
  // next one is blackboxed because they come from external API, we provide data "as-is"
  // and simplschema is annoying with Mongo embedded-arrays updates
  doctorants: {type: Array, optional: true, blackbox: true },
  "doctorants.$": { type: doctorantSchema},
  createdAt: { type: Date, optional: true, autoValue: function () { !this.isSet && new Date() } },
  createdBy: { type: String, optional: true},
  isAllSelected: { type: Boolean, defaultValue: false },
})

ImportScipersList.attachSchema(ImportScipersList.schema);
