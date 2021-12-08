import {Meteor} from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import {canAccessDoctoralSchoolEdition} from "/imports/policy/doctoralSchools"
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema"
import {auditLogConsoleOut} from "/imports/lib/logging";


export const updateDoctoralSchool = new ValidatedMethod({
  name: 'doctoralSchools.updateDoctoralSchool',

  validate: DoctoralSchools.schema!.validator({ clean: true }),

  applyOptions: {
    noRetry: true,
  },

  run({_id, ...doctoralSchoolData}: {_id: string, doctoralSchoolData: DoctoralSchool}) {

    if (!canAccessDoctoralSchoolEdition()) {
        if (Meteor.isServer) {
          const auditLog = auditLogConsoleOut.extend('server/methods')
          auditLog(`Unallowed user trying to edit a doctoral school`)
        }
        throw new Meteor.Error(403, 'You are not allowed to add a doctoral school')
    }

    const doctoralSchool = DoctoralSchools.findOne(_id);

    if (!doctoralSchool) {
      throw new Meteor.Error('DoctoralSchools.methods.update',
        'Cannot find a doctoral schools to update.');
    }

    return DoctoralSchools.update(_id, { $set: { ...doctoralSchoolData } })
  }
});
