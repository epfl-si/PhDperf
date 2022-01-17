import {Meteor} from "meteor/meteor";
import isaReturnExample from "../../imports/ui/components/ImportSciper/edic.json";
import {DoctorantInfoSelectable, ImportScipersList} from "/imports/api/importScipers/schema";
import {isaResponse} from "/imports/api/importScipers/isaTypes";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {auditLogConsoleOut} from "/imports/lib/logging";


Meteor.methods({

  async getISAScipers(doctoralSchoolAcronym) {
    // will be the API call
    const isaReturn = isaReturnExample[0] as isaResponse
    const doctorants = isaReturn.doctorants as DoctorantInfoSelectable[]

    if (!canImportScipersFromISA()) {
        const auditLog = auditLogConsoleOut.extend('server/methods')
        auditLog(`Unallowed user trying to import scipers from ISA`)

        throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    if (doctoralSchoolAcronym !== 'EDIC') {
      throw new Meteor.Error('importScipersList.methods.fetch.NotReady',
        'We are not doing anything different than the EDIC')
    }

    //const importSciperList = ImportScipersList.find({doctoralSchoolAcronym: doctoralSchoolAcronym})


    ImportScipersList.upsert({doctoralSchoolAcronym: doctoralSchoolAcronym}, {
      $set: {
        doctoralSchoolAcronym: doctoralSchoolAcronym,
        doctorants: doctorants,
        createdAt: new Date(),
        createdBy: Meteor.user()?._id,
        isAllSelected: false,
      }
    })
  },

  async toggleDoctorantCheck(doctoralSchoolAcronym, sciper, checked: boolean) {
    if (!canImportScipersFromISA()) {
      const auditLog = auditLogConsoleOut.extend('server/methods')
      auditLog(`Unallowed user trying to import scipers from ISA`)

      throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    // https://docs.mongodb.com/drivers/node/current/fundamentals/crud/write-operations/embedded-arrays/
    const query = { doctoralSchoolAcronym: doctoralSchoolAcronym, }
    const updateDocument = {
      $set: { "doctorants.$[doctorantInfo].isSelected": checked }
    }
    const options = {
      arrayFilters: [{
        "doctorantInfo.doctorant.sciper": sciper
      }]
    }

    ImportScipersList.update(query, updateDocument, options)
  },

  async toggleAllDoctorantCheck(doctoralSchoolAcronym: string, checked: boolean) {
    if (!canImportScipersFromISA()) {
      const auditLog = auditLogConsoleOut.extend('server/methods')
      auditLog(`Unallowed user trying to import scipers from ISA`)

      throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    ImportScipersList.update({
      doctoralSchoolAcronym: doctoralSchoolAcronym,
    }, { $set: { "doctorants.$[].isSelected": checked } } )
    ImportScipersList.update({
      doctoralSchoolAcronym: doctoralSchoolAcronym,
    }, { $set: { "isAllSelected": checked } } )
  },

  /*
  async startPhDAssess(ImportScipersListId) {
    // start phd assess for a list, with provided data (selected ones, scipers added, ...)
  },
   */

})
