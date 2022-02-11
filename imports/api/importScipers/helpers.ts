
import {ImportScipersList} from "/imports/api/importScipers/schema";


export const refreshAlreadyStartedImportScipersList = (doctoralSchoolAcronym: string,
                                                       hasAlreadyStarted: boolean,
                                                       doctorantSciper: string) => {
  return ImportScipersList.update(
    {doctoralSchoolAcronym: doctoralSchoolAcronym},
    {
      $set: {
        "doctorants.$[doctorantInfo].hasAlreadyStarted": hasAlreadyStarted,
      }
    },
    {
      arrayFilters: [{
        "doctorantInfo.doctorant.sciper": doctorantSciper
      }]
    }
  )
}
