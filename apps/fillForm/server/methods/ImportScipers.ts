import {Meteor} from "meteor/meteor";

import {DoctorantInfoSelectable, ImportScipersList} from "/imports/api/importScipers/schema";
import {isaResponse} from "/imports/api/importScipers/isaTypes";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {auditLogConsoleOut} from "/imports/lib/logging";
import {getUserInfoMemoized} from "/server/userFetcher";
import _ from "lodash";
import {Tasks} from "/imports/model/tasks";
import {zBClient} from "/server/zeebe_broker_connector";
import {encrypt} from "/server/encryption";
import {canStartProcessInstance} from "/imports/policy/tasks";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {fetchTimeout} from "/imports/lib/fetchTimeout";
import AbortController from "abort-controller";
import path from 'path'


const debug = require('debug')('server/methods/ImportScipers')

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
    if (doctorant.thesis?.coDirecteur) {
      if ("sciper" in doctorant.thesis.coDirecteur && doctorant.thesis.coDirecteur.sciper) {
        if ("email" in doctorant.thesis.coDirecteur && doctorant.thesis.coDirecteur.email) {
          // case : email is not the one we have in our db
          try {
            // check that the provided epfl email is still up-to-date with the websrv db
            if (doctorant.thesis.coDirecteur.email.includes('@epfl.ch')) {
              doctorants[index].needCoDirectorData = !(await verifyEmailFromSciper(doctorant.thesis.coDirecteur.email, doctorant.thesis.coDirecteur.sciper))
            } else {
              // for any external email, take it as it is
              doctorants[index].needCoDirectorData = false
            }
          } catch (e) {
            // case :  the api for getting the email from sciper is out of service
            doctorants[index].needCoDirectorData = true
          }
        } else {
          // case : a sciper but no email
          doctorants[index].needCoDirectorData = true
        }
      }
    }
  }
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
    doctorants[index].hasAlreadyStarted = alreadyStartedStudentsScipers.includes(doctorant.doctorant.sciper)
  }
}

const fetchISA = async (doctoralSchoolAcronym: string) => {
  if (!process.env.ISA_IMPORT_API_URL) throw new Meteor.Error('Configuration error',
    'The app has not been configured for imports. Please contact the admin.')

  const ISAServerUrl = new URL(process.env.ISA_IMPORT_API_URL)
  ISAServerUrl.pathname = path.join(ISAServerUrl.pathname, doctoralSchoolAcronym)

  const controller = new AbortController()

  debug(`Fetching ISA data for ${doctoralSchoolAcronym} from ${ISAServerUrl}...`)
  const response = await fetchTimeout(ISAServerUrl.toString(), 4000, controller.signal)

  debug(`response from ISA for ${doctoralSchoolAcronym} : ${JSON.stringify(response.body)}`)
  return response.json()
}

Meteor.methods({

  async getISAScipers(doctoralSchoolAcronym) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canImportScipersFromISA(user)) {
      const auditLog = auditLogConsoleOut.extend('server/methods')
      auditLog(`Unallowed user trying to import scipers from ISA`)

      throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    ImportScipersList.remove({doctoralSchoolAcronym: doctoralSchoolAcronym})

    let isaReturn = null as isaResponse | null

    try {

      if (process.env.ISA_LOCAL_DATA && process.env.ISA_LOCAL_DATA === 'true') {
        isaReturn = require("../fixtures/sampleISAData.json")[0]
      } else {
        isaReturn = (await fetchISA(doctoralSchoolAcronym))[0]
      }

      let doctorants = _.cloneDeep((isaReturn!.doctorants as DoctorantInfoSelectable[]))
      await enhanceThesisCoDirectors(doctorants)
      setAlreadyStarted(doctorants)

      ImportScipersList.insert({
        _id: doctoralSchoolAcronym,  // import for the ImportScipers hooks
        doctoralSchoolAcronym: doctoralSchoolAcronym,
        doctorants: doctorants,
        createdAt: new Date(),
        createdBy: user._id ?? '',
        isAllSelected: false,
      })
    } catch (e: any) {
      throw new Meteor.Error('ISA fetching',
        `Unable to fetch ISA data. ${e.message ?? ''}`)
    }
  },

  async toggleDoctorantCheck(doctoralSchoolAcronym, sciper, checked: boolean) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canImportScipersFromISA(user)) {
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
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canImportScipersFromISA(user)) {
      const auditLog = auditLogConsoleOut.extend('server/methods')
      auditLog(`Unallowed user trying to import scipers from ISA`)

      throw new Meteor.Error(403, 'You are not allowed to import scipers')
    }

    if (checked) {
      const query = { doctoralSchoolAcronym: doctoralSchoolAcronym, }
      const updateDocument = {
        $set: { "doctorants.$[doctorantInfo].isSelected": checked }
      }
      const options = {
        arrayFilters: [{
          "doctorantInfo.needCoDirectorData": {$ne: true},
          "doctorantInfo.thesis.mentor": {$ne: null},
          "doctorantInfo.hasAlreadyStarted": {$ne: true}
        }]
      }
      ImportScipersList.update(query, updateDocument, options)
    } else {
      const query = { doctoralSchoolAcronym: doctoralSchoolAcronym, }
      const updateDocument = {
        $set: { "doctorants.$[].isSelected": checked }
      }
      const options = {}
      ImportScipersList.update(query, updateDocument, options)
    }

    ImportScipersList.update({
      doctoralSchoolAcronym: doctoralSchoolAcronym,
    }, { $set: { "isAllSelected": checked } } )
  },

  async setCoDirectorSciper(doctoralSchoolAcronym: string,
                            doctorantSciper: string,
                            coDirectorSciper: string) {

    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canImportScipersFromISA(user)) {
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
  },

  async startPhDAssess(doctoralSchoolAcronym: string) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    const auditLog = auditLogConsoleOut.extend('server/methods')

    const ds = DoctoralSchools.findOne({'acronym': doctoralSchoolAcronym})

    if (!ds || !canStartProcessInstance(user, [ds]) || !canImportScipersFromISA(user)) {
      auditLog(`Unallowed user ${user._id} is trying to start a workflow.`)
      throw new Meteor.Error(403, 'You are not allowed to start a workflow')
    }

    auditLog(`starting batch imports`)

    if(!zBClient) throw new Meteor.Error(500, `The Zeebe client has not been able to start on the server.`)

    const doctoralSchool = DoctoralSchools.findOne({acronym: doctoralSchoolAcronym})

    if (!doctoralSchool) throw new Meteor.Error(500, `The doctoral school does not exist anymore`)
    const programDirector = await getUserInfoMemoized(doctoralSchool.programDirectorSciper)

    // set the loading status
    const query = { doctoralSchoolAcronym: doctoralSchoolAcronym, }
    const updateDocument = {
      $set: { "doctorants.$[doctorantInfo].isBeingImported": true }
    }
    const options = {
      arrayFilters: [{
        "doctorantInfo.needCoDirectorData": {$ne: true},
        "doctorantInfo.hasAlreadyStarted": {$ne: true}
      }]
    }
    ImportScipersList.update(query, updateDocument, options)

    const imports = ImportScipersList.findOne({
      doctoralSchoolAcronym: doctoralSchoolAcronym,
    })

    const doctorantsToLoad = imports!.doctorants?.filter((doctorant) => doctorant.isSelected)

    const ProcessInstanceCreationPromises: any = []
    doctorantsToLoad?.forEach((doctorant) => {
      const dataToPush = {
        doctoralProgramName: encrypt(doctoralSchool.acronym),
        doctoralProgramEmail: encrypt(`${doctoralSchool.acronym}@epfl.ch`),
        docLinkAnnualReport: encrypt(doctoralSchool.helpUrl),
        creditsNeeded: encrypt(doctoralSchool.creditsNeeded.toString()),
        programDirectorSciper: encrypt(doctoralSchool.programDirectorSciper),
        programDirectorName: encrypt(programDirector.firstname + ' ' + programDirector.name),
        programDirectorEmail: encrypt(programDirector.email),

        dateOfCandidacyExam: encrypt(doctorant.dateExamCandidature ?? ''),
        dateOfEnrolment: encrypt(doctorant.dateImmatriculation ?? ''),

        phdStudentSciper: encrypt(doctorant.doctorant.sciper),
        phdStudentName: encrypt(doctorant.doctorant.fullName),
        phdStudentEmail: encrypt(doctorant.doctorant.email),

        mentorSciper: encrypt(doctorant.thesis.mentor.sciper),
        mentorName: encrypt(doctorant.thesis.mentor.fullName),
        mentorEmail: encrypt(doctorant.thesis.mentor.email),

        thesisDirectorSciper: encrypt(doctorant.thesis.directeur.sciper),
        thesisDirectorName: encrypt(doctorant.thesis.directeur.fullName),
        thesisDirectorEmail: encrypt(doctorant.thesis.directeur.email),

        thesisCoDirectorSciper: encrypt(doctorant.thesis.coDirecteur?.sciper ?? ''),
        thesisCoDirectorName: encrypt(doctorant.thesis.coDirecteur?.fullName ?? ''),
        thesisCoDirectorEmail: encrypt(doctorant.thesis.coDirecteur?.email ?? ''),

        programAssistantSciper: encrypt(user!._id),
        programAssistantName: encrypt(user?.tequila?.displayname ?? ''),
        programAssistantEmail: encrypt(user?.tequila.email ?? ''),
      }

      ProcessInstanceCreationPromises.push(
        zBClient!.createProcessInstance('phdAssessProcess', _.merge(dataToPush, {
          created_at: encrypt(new Date().toJSON()),
          created_by: encrypt(user!._id),
          updated_at: encrypt(new Date().toJSON()),
        })
      ))
    })

    try {
      await Promise.all(ProcessInstanceCreationPromises)
    } catch (error) {
      throw new Meteor.Error('Zeebe error', 'Unable to start imports. Please contact 1234@epfl.ch.')
    } finally {
      // set the loading status
      const query = { doctoralSchoolAcronym: doctoralSchoolAcronym, }
      const updateDocument = {
        $set: {
          "isAllSelected": false,
          "doctorants.$[].isBeingImported": false,
          "doctorants.$[].isSelected": false
        }
      }
      const options = {}
      ImportScipersList.update(query, updateDocument, options)
    }
  },
})
