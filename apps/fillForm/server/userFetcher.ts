import { Headers } from 'meteor/fetch'
import AbortController from 'abort-controller'
import memoize from 'timed-memoize'
import {PhDInputVariables} from "/imports/model/tasksTypes";
import {ParticipantIDs} from "/imports/model/participants";
import {fetchTimeout} from "/imports/lib/fetchTimeout";

const debug = require('debug')('server/userFetcher')

// see http://websrv.epfl.ch/RWSPersons.html for detail definition
// see ./doc/API-clients/websrv to explore the API

interface GetPersonBadResult {
  error: {
    text: string
  }
}

interface PersonInfo {
  accreds: []
  addresses: []
  display: string
  email: string
  firstname: string
  firstnameus: string
  id: number | string
  name: string
  nameus: string
  org: string
  physemail: string
  sciper: number | string
  sex: string
  status: string
  studies: []
  type: string
  uid: string
  upfirstname: string
  upname: string
  username: string
}

export interface GetPersonGoodResult {
  result: PersonInfo
}

export async function getUserInfo (sciper: string | number): Promise<PersonInfo | undefined> {
  const app = 'phd-assess'
  const caller = '000000'
  const password = process.env.WEBSRV_PASSWORD
  const server = 'https://websrv.epfl.ch/'
  const url = `${server}cgi-bin/rwspersons/getPerson?app=${app}&caller=${caller}&password=${password}&id=${sciper}`

  const controller = new AbortController()

  debug(`Requesting ${server} for user info for ${sciper}`)

  const response = await fetchTimeout(url, 4000, controller.signal, {
      "headers": new Headers({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
      }),
      "method": "GET"
    }
  );

  let jsonResponse: any

  try {
    jsonResponse = await response.json()
  } catch (e: any) {  // can't json decode the result ? hhmmmm not good
    console.warn(
      `${ server } has returned a bad result for ${ sciper }.`,
      `Nothing is returned/cached as a result.`,
      `Error was: ${response.text}.`)
    return
  }

  if ('error' in jsonResponse) {
    // not working as expected, transform it to an error, so we can catch it later
    const badJsonResponse = jsonResponse as GetPersonBadResult
    console.warn(
      `${ server } has returned a bad result for ${ sciper }.`,
      `Nothing is returned/cached as a result.`,
      `Error was: ${badJsonResponse.error.text}.`)
    return
  }

  const goodJsonResponse = jsonResponse as GetPersonGoodResult
  debug(`response for the user info fetch ${ sciper } : ${JSON.stringify(goodJsonResponse)}`)
  return goodJsonResponse.result
}

// keep users info in memory for 24 hours
export const getUserInfoMemoized = memoize(
  getUserInfo, {
    timeout: 86400000,
    hot:false,
    // getUserInfo should return undefined when something wrong is going on,
    // so we can invalidate the cache
    discardUndefined: true,
  }
)

/*
 * Transform outputting Meteor Participants into Zeebe Variables
 * Return only participant's variables that need an update
 */
export const getParticipantsToUpdateFromSciper = async (variables: PhDInputVariables) => {

  let updatedParticipants: any = {}

  for (const participantName of ParticipantIDs) {

    const vSciper = variables[`${participantName}Sciper`]
    const vEmail = variables[`${participantName}Email`]
    const vUsageName = variables[`${participantName}Name`]
    const vFirstName = variables[`${participantName}FirstName`]
    const vLastName = variables[`${participantName}LastName`]

    if (vSciper) {  // we are going to check if participant exists, firstly
      const participantInfo = await getUserInfoMemoized(vSciper!)

      // assert all data are here, or ignore this participant
      if (!participantInfo || !(participantInfo.name && participantInfo.email)) {
        continue
      }

      if (!vEmail || participantInfo.email !== vEmail) {
        updatedParticipants[`${participantName}Email`] = participantInfo.email
      }

      // usageName has to be built
      const usageName = []
      usageName.push(participantInfo.firstnameus || participantInfo.firstname)
      usageName.push(participantInfo.nameus || participantInfo.name)
      const fullName = usageName.join(' ')

      if (!vUsageName || fullName !== vUsageName) {
        updatedParticipants[`${participantName}Name`] = fullName
      }

      // keep the real names information too for the student, may be needed by some step later (like in GED folder's name)
      if (participantName === "phdStudent") {
        const firstName = participantInfo.firstname || participantInfo.firstnameus
        const lastName = participantInfo.name || participantInfo.nameus

        if (!vFirstName || firstName !== vFirstName) {
          updatedParticipants[`${participantName}FirstName`] = firstName
        }

        if (!vLastName || lastName !== vLastName) {
          updatedParticipants[`${participantName}LastName`] = lastName
        }
      }
    }
  }

  return updatedParticipants
}
