import {Meteor} from "meteor/meteor";

import {assert} from 'chai'

import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {initialEcolesDoctorales} from "/server/fixtures/doctoralSchools";


describe('Unit tests DoctoralSchools', function () {
  beforeEach(function () {
    if ( DoctoralSchools.find({}).count() === 0 ) {
      initialEcolesDoctorales.forEach((doctoralSchool) => {
        DoctoralSchools.insert(doctoralSchool);
      });
    }
  });

  if (Meteor.isServer) {
    it('should have doctoral schools data', function () {
      // _dburlesFactory.Factory.create("doctoralSchool");

      const ds = DoctoralSchools.find({})
      assert.notStrictEqual(ds.count(), 0)
    });
  }
});
