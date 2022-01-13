import {Meteor} from "meteor/meteor";
import isaReturnExample from "../../imports/ui/components/ImportSciper/edic.json";
import {ImportScipersList} from "/imports/api/importScipers/schema";
import {DoctorantInfo, isaResponse} from "/imports/api/importScipers/isaTypes";


Meteor.methods({

  async getISAScipers(doctoralSchoolAcronym) {
    // will be the API call
    const isaReturn = isaReturnExample[0] as isaResponse
    const doctorants = isaReturn.doctorants as DoctorantInfo[]

    /*
    if (!canAccessDoctoralSchoolEdition()) {
        if (Meteor.isServer) {
          const auditLog = auditLogConsoleOut.extend('server/methods')
          auditLog(`Unallowed user trying to edit a doctoral school`)
        }
        throw new Meteor.Error(403, 'You are not allowed to add a doctoral school')
    }
     */

    if (doctoralSchoolAcronym !== 'EDIC') {
      throw new Meteor.Error('importScipersList.methods.fetch.NotReady',
        'We are not doing anything different than the EDIC')
    }

    ImportScipersList.upsert({doctoralSchoolAcronym: doctoralSchoolAcronym}, {
      $set: {
        doctoralSchoolAcronym: doctoralSchoolAcronym,
        doctorants: doctorants,
        createdBy: Meteor.user()?._id
      }
    })
  },

  async toggleDoctorant(ImportScipersListId, doctorantSciper) {
  },

  async toggleAllDoctorant(ImportScipersListId) {
  },

  async startPhDAssess(ImportScipersListId) {
    // start phd assess for a list, with provided data (selected ones, scipers added, ...)
  },

})
