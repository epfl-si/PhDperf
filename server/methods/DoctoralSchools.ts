import {Meteor} from "meteor/meteor";
import {canImportScipersFromISA} from "/imports/policy/importScipers";
import {getUserInfoMemoized} from "/server/userFetcher";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";


Meteor.methods({
  async refreshDoctoralSchoolsProgramNameFromSciper(doctoralSchoolAcronym) {
    let user: Meteor.User | null = null
    if (this.userId) {
      user = Meteor.users.findOne({_id: this.userId}) ?? null
    }

    if (!user) return

    if (!canImportScipersFromISA(user)) {
      throw new Meteor.Error(403, 'You are not allowed to refresh this data')
    }

    const doctoralSchool = DoctoralSchools.findOne({acronym: doctoralSchoolAcronym})

    if (doctoralSchool) {
      const programDirector = await getUserInfoMemoized(doctoralSchool.programDirectorSciper)

      if (programDirector && programDirector.name && programDirector.firstname) {
        DoctoralSchools.update(
          {_id: doctoralSchool._id},
          {$set: {programDirectorName: `${programDirector.firstname} ${programDirector.name}`}}
        )
      }
    }
  },
})
