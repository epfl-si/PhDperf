import { Headers } from 'meteor/fetch'
import AbortController from 'abort-controller'
import memoize from 'timed-memoize'
import {PhDInputVariables} from "/imports/model/tasksTypes";
import {ParticipantRoles} from "/imports/model/participants";
import {fetchTimeout} from "/imports/lib/fetchTimeout";

const debug = require('debug')('server/userFetcher')

// see https://api.epfl.ch/docs/persons-api/index.html#/persons/get_v1_persons__id_ for detail definition
// see ./doc/API-clients/api.epfl.ch/Persons API to explore the API
interface APIPersonInfo {
  id: number | string
  firstname: string
  lastname: string
  firstnameofficial: string
  lastnameofficial: string
  email: string
}

export async function getUserInfo (sciper: string | number): Promise<APIPersonInfo | undefined> {
  const server = 'https://api.epfl.ch/'
  const url = `${server}v1/persons/${sciper}`
  const authToken = process.env.API_EPFL_CH_TOKEN

  if (!authToken) {
    console.warn(
      `API is not configured correctly. Skipping user info update feature.`,
      `Nothing is returned/cached as a result.`,
    )
    return
  }

  const controller = new AbortController()

  debug(`Requesting ${url} for user info`)

  try {
    const response = await fetchTimeout(url, 4000, controller.signal, {
        "headers": new Headers({
          "accept": "application/json",
          "authorization": `Basic ${authToken}`,
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
        }),
        "method": "GET"
      }
    );

    let jsonResponse: any

    try {
      jsonResponse = await response.json()
    } catch (e: any) {  // can't json decode the result ? not good
      console.warn(
        `${ server } has returned a bad result for ${ sciper }.`,
        `Nothing is returned/cached as a result.`,
        `Error was: ${response.text}.`)
      return
    }

    const goodJsonResponse = jsonResponse as APIPersonInfo
    debug(`response for the user info fetch ${ sciper } : ${JSON.stringify(goodJsonResponse)}`)

    return goodJsonResponse

  } catch (e: unknown) {
    let errorMessage;
    let errorName;

    if (typeof e === "string") {
      errorMessage = e // works, `e` narrowed to string
      errorName = ''
    } else if (e instanceof Error) {
      errorMessage = e.message // works, `e` narrowed to Error

      if (e.name === 'AbortError') {
        // error message on abort because timeout is really confusing
        errorMessage = 'Timeout'
      }
    }

    // any error (404, 500, ...) is returned as undefined, so we can invalidate caches
    console.warn(
      `${ server } is not responding correctly for ${ sciper }.`,
      `Nothing is returned/cached as a result.`,
      `Error was: ${errorName}, ${errorMessage}.`)

    throw e
  }
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

  for (const participantName of Object.values(ParticipantRoles)) {

    const vSciper = variables[`${participantName}Sciper`]
    const vEmail = variables[`${participantName}Email`]
    const vFirstNameUsage = variables[`${participantName}FirstNameUsage`]
    const vLastNameUsage = variables[`${participantName}LastNameUsage`]
    const vUsageName = variables[`${participantName}Name`]
    const vFirstNameOfficial = variables[`${participantName}FirstName`]
    const vLastNameOfficial = variables[`${participantName}LastName`]

    if (vSciper) {  // we are going to check if participant exists, firstly
      const participantInfo = await getUserInfoMemoized(vSciper!)

      // assert all data are here, or ignore this participant
      if (!participantInfo || !(
        participantInfo.firstname &&
        participantInfo.lastname &&
        participantInfo.email)
      ) {
        continue
      }

      if (!vEmail || participantInfo.email !== vEmail) {
        updatedParticipants[`${participantName}Email`] = participantInfo.email
      }

      if (!vFirstNameUsage || participantInfo.firstname !== vFirstNameUsage) {
        updatedParticipants[`${participantName}FirstNameUsage`] = participantInfo.firstname
      }

      if (!vLastNameUsage || participantInfo.lastname !== vLastNameUsage) {
        updatedParticipants[`${participantName}LastNameUsage`] = participantInfo.lastname
      }

      if (!vUsageName ||
        vUsageName !== `${ participantInfo.firstname } ${participantInfo.lastname}`
      ) {
        updatedParticipants[`${participantName}Name`] = `${ participantInfo.firstname } ${participantInfo.lastname}`
      }

      // keep the real names information for the student, may be needed by a step later (like in GED folder's name)
      if (participantName === "phdStudent") {
        const firstNameOfficial = participantInfo.firstnameofficial
        const lastNameOfficial = participantInfo.lastnameofficial

        if (!vFirstNameOfficial || vFirstNameOfficial !== firstNameOfficial) {
          updatedParticipants[`${participantName}FirstName`] = firstNameOfficial
        }

        if (!vLastNameOfficial || vLastNameOfficial !== lastNameOfficial) {
          updatedParticipants[`${participantName}LastName`] = lastNameOfficial
        }
      }
    }
  }

  return updatedParticipants
}

/**
 * Provide user info from an env file. It used for development envs that
 * do not have access to the api.
 * Env. data exemple:
 *   PARTICIPANT_PHDSTUDENT_SCIPER="1111111"
 *   PARTICIPANT_PHDSTUDENT_NAME="Joe Bar"
 *   PARTICIPANT_PHDSTUDENT_EMAIL="joe.bar@somewhere.com"
 */
export const getParticipantsToUpdateFromEnv = async () => {
  let updatedParticipants: any = {}

  for (const participantName of Object.values(ParticipantRoles)) {

    const firstName = process.env[`PARTICIPANT_${ participantName.toUpperCase() }_FIRSTNAME`] ?? ''
    const lastName = process.env[`PARTICIPANT_${ participantName.toUpperCase() }_LASTNAME`] ?? ''

    updatedParticipants[`${ participantName }Sciper`] = process.env[`PARTICIPANT_${ participantName.toUpperCase() }_SCIPER`] ?? ''
    updatedParticipants[`${ participantName }FirstName`] = firstName
    updatedParticipants[`${ participantName }LastName`] = lastName
    updatedParticipants[`${ participantName }Email`] = process.env[`PARTICIPANT_${ participantName.toUpperCase() }_EMAIL`] ?? ''
    updatedParticipants[`${ participantName }Name`] = (firstName && lastName) ? `${firstName} ${lastName}` : ''
  }

  return updatedParticipants
}
