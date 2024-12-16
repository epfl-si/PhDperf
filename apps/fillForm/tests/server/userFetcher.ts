/**
 * Note on the comment: these tests were written for websrv.
 * Some may still work, but an iteration is needed.
 */

// import {faker} from "/tests/factories/faker";
//
// var chai = require("chai");
// var chaiAsPromised = require("chai-as-promised");
// chai.use(chaiAsPromised);
//
// const assert = chai.assert;
//
// import nock from 'nock'
//
// import {GetPersonGoodResult, getUserInfo, getUserInfoMemoized} from "/server/userFetcher";
// import {createRandomUser} from "/tests/factories/users";
//
// const setGoodNock = (randomUser: any) => {
//   const goodPayload = {
//     result: {
//       display: randomUser.tequila.displayname,
//       email: randomUser.tequila.email,
//       firstname: randomUser.tequila.firstname,
//       id: randomUser._id,
//       name: randomUser.tequila.name,
//       sciper: randomUser._id,
//       username: randomUser.tequila.username,
//     } as Partial<GetPersonGoodResult>  // get a minimal working sample
//   }
//
//   return nock('https://websrv.epfl.ch/')
//     .get(uri => uri.includes('getPerson'))
//     .query(true)
//     .reply(301, function () {
//       return goodPayload
//     })
// }
//
// const setBadNock = () => {
//   const badPayload = '<'
//
//   return nock('https://websrv.epfl.ch/')
//     .get(uri => uri.includes('getPerson'))
//     .query(true)
//     .reply(200, function () {
//       return badPayload
//     })
// }
//
//
// describe(
//   'Testing the memoization of the userFetch with good results', function () {
//
//     let nockWebsrv: nock.Scope | undefined
//     let randomUser: any
//
//     beforeEach(async () => {
//       randomUser = createRandomUser()
//
//
//       // first cut all network call, we test in a closed network
//       nock.disableNetConnect()
//
//       // set the mock
//       nockWebsrv = setGoodNock(randomUser)
//     });
//
//     afterEach(async () => {
//       nock.cleanAll();
//
//       // reactivate network
//       nock.enableNetConnect()
//     });
//
//     it('it should not memoize the result with the standard fetcher', async function () {
//       // check the mock is ready to be called
//       assert.isFalse(nockWebsrv!.isDone())
//
//       // call the non memoized method, to see if it is working
//       await getUserInfo(randomUser.sciper)
//
//       assert.isTrue(nockWebsrv!.isDone())
//
//       await assert.isRejected(
//         getUserInfo(randomUser.sciper),
//         undefined,
//         /request.*failed.*Nock/,
//         'second call should now raise an error, as the mock is no more and the network is cut'
//       )
//     })
//
//     it('it should memoize the result with the memoized fetcher', async function () {
//       // check the mock is ready to be called
//       assert.isFalse(nockWebsrv!.isDone())
//
//       await assert.isFulfilled(
//         getUserInfoMemoized(randomUser.sciper),
//         'call the non memoized method, to see if it is working'
//       )
//
//       assert.isTrue(nockWebsrv!.isDone())
//
//       await assert.isFulfilled(
//         getUserInfoMemoized(randomUser.sciper),
//         'second call to memoized should not raise the nock error because the network is cut'
//         )
//     })
// });
//
//
// describe(
//   'Testing the memoization of the userFetch with bad results', function () {
//     let nockWebsrv: nock.Scope | undefined
//     let sciperToTest: number
//     const badPayload = '<'
//
//     beforeEach(async () => {
//       // first cut all network call, we test in a closed network
//       nock.disableNetConnect()
//
//       // set the mock
//       nockWebsrv = setBadNock()
//     });
//
//     afterEach(async () => {
//       nock.cleanAll();
//
//       // reactivate network
//       nock.enableNetConnect()
//     });
//
//     it('it should not memoize the bad returns', async function () {
//       sciperToTest = faker.sciper()
//
//       assert.isFalse(nockWebsrv!.isDone(), 'the mocked api should not have been called')
//
//       // check first the payload is really not a JSON
//       assert.throws(
//         () => JSON.parse(badPayload), SyntaxError
//       )
//
//       // wrong payload should output an empty return
//       await assert.becomes(
//         getUserInfoMemoized(sciperToTest),
//         undefined,
//         "First call with a bad payload should return nothing");
//
//       assert.isTrue(nockWebsrv!.isDone(), 'the mocked api should have been called')
//
//       // remove the bad mock and set the good one, to simulate an API service recovery
//       nock.cleanAll();
//       nockWebsrv = setGoodNock(createRandomUser())
//       assert.isFalse(nockWebsrv!.isDone(), 'the mocked api should not have been called')
//
//       // now if we call again, the memoized should not be activated,
//       // and the good response available
//       await assert.isFulfilled(
//         getUserInfoMemoized(sciperToTest),
//         'As the mock is set to be in good form now, it should resolve in a good way'
//       )
//     });
// });
