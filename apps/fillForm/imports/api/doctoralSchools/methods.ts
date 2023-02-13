/// <reference path="../../../node_modules/@types/meteor-mdg-validated-method/index.d.ts" />
// have to reference the type file because the ':' in the package name. See :
// https://forums.meteor.com/t/typescript-trouble-importing-types-for-meteor-packages-in-vscode/54756
import {Meteor} from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import {
  canCreateDoctoralSchool,
  canEditDoctoralSchool,
} from "/imports/policy/doctoralSchools"
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema"
import {auditLogConsoleOut} from "/imports/lib/logging";


export const insertDoctoralSchool = new ValidatedMethod({
  name: 'doctoralSchools.methods.insert',

  validate: DoctoralSchools.schema!.validator({ clean: true }),

  applyOptions: {
    noRetry: true,
  },

  run(newDoctoralSchool: DoctoralSchool) {
    if (!canCreateDoctoralSchool(Meteor.user())) {
      if (Meteor.isServer) {
        const auditLog = auditLogConsoleOut.extend('server/methods')
        auditLog(`Unallowed user trying to add a doctoral school`)
      }
      throw new Meteor.Error(403, 'You are not allowed to add a doctoral school')
    }

    try {
      const uniqID = DoctoralSchools.insert(newDoctoralSchool)

      if (Meteor.isServer) {
        const auditLog = auditLogConsoleOut.extend('server/methods')
        auditLog(`Inserted a new doctoral school ${JSON.stringify(newDoctoralSchool)}`)
      }

      return uniqID
    } catch (e: any) {
      if (e.name === 'BulkWriteError' && e.code === 11000) {
        throw new Meteor.Error('Create Error',
          `Duplicate acronym found`);
      } else {
        throw new Meteor.Error('Create Error',
          `${JSON.stringify(e)}`);
      }
    }
  }
});

export const updateDoctoralSchool = new ValidatedMethod({
  name: 'doctoralSchools.methods.update',

  validate: DoctoralSchools.schema!.validator({ clean: true }),

  applyOptions: {
    noRetry: true,
  },

  run({ _id, acronym, label, helpUrl, creditsNeeded, programDirectorSciper }: DoctoralSchool) {
    const doctoralSchool = DoctoralSchools.findOne(_id);
    if (!doctoralSchool) {
      throw new Meteor.Error('DoctoralSchools.methods.update',
        'Cannot find a doctoral schools to update.');
    }

    if (!canEditDoctoralSchool(Meteor.user(), doctoralSchool)) {
        if (Meteor.isServer) {
          const auditLog = auditLogConsoleOut.extend('server/methods')
          auditLog(`Unallowed user trying to edit a doctoral school`)
        }
        throw new Meteor.Error(403, 'You are not allowed to add a doctoral school')
    }

    try {
      const nbUpdated = DoctoralSchools.update(
        _id!, {
          $set: {
            acronym,
            label,
            helpUrl,
            creditsNeeded,
            programDirectorSciper,
          }
        })

      if (Meteor.isServer) {
        const auditLog = auditLogConsoleOut.extend('server/methods')
        auditLog(`Updated the doctoral school id ${_id}`)
      }

      return nbUpdated
    } catch (e: any) {
      if (e.name === 'MongoError' && e.code === 11000) {
        throw new Meteor.Error('Update Error',
          `Duplicate acronym found ${JSON.stringify(e.keyValue)}`);
      } else {
        throw new Meteor.Error('Create Error',
          `${JSON.stringify(e)}`);
      }
    }
  }
});
