import {Meteor} from "meteor/meteor";
import isaReturnExample from "../../imports/ui/components/ImportSciper/edic.json";
import {DoctorantInfoSelectable, ImportScipersList} from "/imports/api/importScipers/schema";
import {isaResponse} from "/imports/api/importScipers/isaTypes";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {auditLogConsoleOut} from "/imports/lib/logging";
import {getUserInfoMemoized} from "/server/userFetcher";
import _ from "lodash";
import {Tasks} from "/imports/api/tasks";


/*
 * Thesis co directors can have
 *   - a "wrong" sciper value (that is unknown / obsolete)
 *   - no value at all
 *   - good values (sciper + email)
 * this method try to fetch information about that, and clean the data accordingly
 * by cleaning, we means, at the end, we have :
 *   - coDirecteur = null -> no need for a codirector
 *   - coDirecteur = {} -> we need someone to add the values
 *   - coDirecteur = {...coDirecteurInfo} -> all good
 */
const enhanceThesisCoDirectors = async (doctorants: DoctorantInfoSelectable[]) => {
  const verifyEmailFromSciper = async (email: string, sciper: string) => {
    if (email && sciper) {
      const userInfo = await getUserInfoMemoized(sciper)
      return email === userInfo.email
    }
  }

  for (let [index, doctorant] of doctorants.entries()) {
    try {
      if (doctorant.thesis?.coDirecteur) {
        if ("sciper" in doctorant.thesis.coDirecteur && doctorant.thesis.coDirecteur?.sciper) {
          // case 1 : a sciper but no email
          if (!("email" in doctorant.thesis.coDirecteur) ||
          // case 2 : // email is not the one we have in our db
            !(await verifyEmailFromSciper(doctorant.thesis.coDirecteur.email, doctorant.thesis.coDirecteur.sciper))) {
            doctorants[index].needCoDirectorData = true
          }
        }
      }
    } catch (error) {
      console.log('error'+ error);
    }
  }

  return doctorants
}

const setAlreadyStarted = (doctorants: DoctorantInfoSelectable[]) => {
  const studentsScipers = _.map(doctorants, 'doctorant.sciper')

  // set the flag for the ones already started
  const alreadyStartedTasks = Tasks.find(
    { 'variables.phdStudentSciper': { $in: studentsScipers } },
    {fields:
        {'variables.phdStudentSciper': 1}
    }
  ).fetch()

  const alreadyStartedStudentsScipers = _.map(alreadyStartedTasks, 'variables.phdStudentSciper')

  for (let [index, doctorant] of doctorants.entries()) {
    if (alreadyStartedStudentsScipers.includes(doctorant.doctorant.sciper))
      doctorants[index].hasAlreadyStarted = true
  }

  return doctorants
}

Meteor.methods({

  async getISAScipers(doctoralSchoolAcronym) {
    if (!canImportScipersFromISA()) {
      const auditLog = auditLogConsoleOut.extend('server/methods')
      auditLog(`Unallowed user trying to import scipers from ISA`)

      throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    if (doctoralSchoolAcronym !== 'EDIC') {
      throw new Meteor.Error('importScipersList.methods.fetch.NotReady',
        'We are not doing anything different than the EDIC')
    }

    // will be the API call
    const isaReturn = isaReturnExample[0] as isaResponse
    let doctorants =(isaReturn.doctorants.slice(0,4) as DoctorantInfoSelectable[])
    doctorants =  await enhanceThesisCoDirectors(doctorants)
    doctorants = setAlreadyStarted(doctorants)

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

    // uncheck the all list if we got an uncheck
    if (!checked) {
      ImportScipersList.update({
        doctoralSchoolAcronym: doctoralSchoolAcronym,
      }, { $set: { "isAllSelected": checked } } )
    }
  },

  async toggleAllDoctorantCheck(doctoralSchoolAcronym: string, checked: boolean) {
    if (!canImportScipersFromISA()) {
      const auditLog = auditLogConsoleOut.extend('server/methods')
      auditLog(`Unallowed user trying to import scipers from ISA`)

      throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    const query = { doctoralSchoolAcronym: doctoralSchoolAcronym, }
    const updateDocument = {
      $set: { "doctorants.$[doctorantInfo].isSelected": checked }
    }
    const options = {}

    if (checked) {
      _.merge(options, {
        arrayFilters: [{
          "doctorantInfo.needCoDirectorData": {$ne: true},
          "doctorantInfo.hasAlreadyStarted": {$ne: true}
        }]
      })
    } else {
      _.merge(options, {
        arrayFilters: [{
          "doctorantInfo.needCoDirectorData": {$in: [null, false]}
        }]
      })
    }

    ImportScipersList.update(query, updateDocument, options)

    ImportScipersList.update({
      doctoralSchoolAcronym: doctoralSchoolAcronym,
    }, { $set: { "isAllSelected": checked } } )
  },

  async setCoDirectorSciper(doctoralSchoolAcronym: string,
                            doctorantSciper: string,
                            coDirectorSciper: string) {

    if (!canImportScipersFromISA()) {
      const auditLog = auditLogConsoleOut.extend('server/methods')
      auditLog(`Unallowed user trying to import scipers from ISA`)

      throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    // validate first the new sciper
    const newCoDirector = await getUserInfoMemoized(coDirectorSciper)

    if (!newCoDirector || !newCoDirector.sciper) {
      throw new Meteor.Error('', `Unknown sciper '${coDirectorSciper}'`)
    }

    const query = { doctoralSchoolAcronym: doctoralSchoolAcronym, }
    const updateDocument = {
      $set: {
        "doctorants.$[doctorantInfo].needCoDirectorData": false,
        "doctorants.$[doctorantInfo].thesis.coDirecteur.sciper": coDirectorSciper,
        "doctorants.$[doctorantInfo].thesis.coDirecteur.fullName": `${newCoDirector.firstname} ${newCoDirector.name}`,
        "doctorants.$[doctorantInfo].thesis.coDirecteur.email": newCoDirector.email,
      }
    }
    const options = {
      arrayFilters: [{
        "doctorantInfo.doctorant.sciper": doctorantSciper
      }]
    }

    ImportScipersList.update(query, updateDocument, options)
  }

    /*
    async startPhDAssess(ImportScipersListId) {
      // start phd assess for a list, with provided data (selected ones, scipers added, ...)
    },
     */
})
