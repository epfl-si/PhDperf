import { fetch, Headers } from 'meteor/fetch'
import memoize from 'timed-memoize'
import {PhDInputVariables} from "/imports/model/tasks";
import {ParticipantIDs} from "/imports/model/participants";

const debug = require('debug')('server/userFetcher')

// see http://websrv.epfl.ch/RWSPersons.html for detail definition

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

interface GetPersonGoodResult {
  result: PersonInfo
}

export async function getUserInfo (sciper: string | number): Promise<PersonInfo> {
  const app = 'SWLM'
  const server = 'https://websrv.epfl.ch/'
  const url = `${server}cgi-bin/rwspersons/getPerson?id=${sciper}&app=${app}`

  debug(`Requesting ${server} for user info for ${sciper}`)

  const response = await fetch(url, {
    "headers": new Headers({
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache"
    }),
    "method": "GET",
  });

  const jsonResponse = await response.json()

  if ('error' in jsonResponse) {
    // not working as expected, transorm it to an error so we can catch it later
    const badJsonResponse = jsonResponse as GetPersonBadResult
    throw new Error(badJsonResponse.error.text)
  }
  const goodJsonResponse = jsonResponse as GetPersonGoodResult
  debug(`response for the user info fetch ${sciper} : ${JSON.stringify(goodJsonResponse)}`)
  return goodJsonResponse.result
}

// keep users info in memory for 24 hours
export const getUserInfoMemoized = memoize(getUserInfo, {timeout: 86400000, hot:false})

/*
 * Transform outputting Meteor Participants into Zeebe Variables
 * We read all the variables, and set the info for all the vars ending with 'Sciper'
 */
export const updateParticipantsFromSciper = async (variables: PhDInputVariables) => {
  for (const participantName of ParticipantIDs) {
    const sciper = variables[`${participantName}Sciper`]
    if (sciper) {
      const participantInfo = await getUserInfoMemoized(sciper)

      // assert all data are here, or raise a problem
      if (!(participantInfo.name && participantInfo.email)) {
        throw `The ${participantName} (${participantInfo.sciper}) is missing a name or an email from the API`;
      }
      variables[`${participantName}Email`] = participantInfo.email

      // build the name
      let fullName = []
      fullName.push(participantInfo.firstnameus || participantInfo.firstname)
      fullName.push(participantInfo.nameus || participantInfo.name)
      variables[`${participantName}Name`] = fullName.join(' ')
    }
  }

  return variables
}
