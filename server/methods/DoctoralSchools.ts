import {Meteor} from "meteor/meteor";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {getUserInfoMemoized} from "/server/userFetcher";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";


Meteor.methods({
  async refreshDoctoralSchoolsProgramNameFromSciper(doctoralSchoolAcronym) {
    if (!canImportScipersFromISA()) {
      throw new Meteor.Error(403, 'You are not allowed to refresh this data')
    }

    const doctoralSchool = DoctoralSchools.findOne({acronym: doctoralSchoolAcronym}) as DoctoralSchool
    const programDirector = await getUserInfoMemoized(doctoralSchool.programDirectorSciper)

    if (programDirector && programDirector.name && programDirector.firstname) {
      DoctoralSchools.update(
        {_id: doctoralSchool._id},
        { $set: {programDirectorName: `${programDirector.firstname} ${programDirector.name}`}}
      )
    }
  },
})
