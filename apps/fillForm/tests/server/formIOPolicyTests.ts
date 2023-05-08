import {assert} from 'chai'
import {Task, Tasks} from "/imports/model/tasks";
import {filterUnsubmittableVars, findFieldKeysToSubmit} from "/imports/policy/tasks";


const dbCleaner = require("meteor/xolvio:cleaner");
const Factory = require("meteor/dburles:factory").Factory

describe('Algos around the FormIO definition testing ', function () {
  let task: Task | null = null

  const dataToSubmit = {
    "doctoralProgramName": "ED01",  // this one is disabled at this formIO step, should not change
    "dateOfEnrolment": "01.05.2023",  // normal field
    "year": "4th year",  // normal field
    "phdStudentName": "Student Name",  // this one is disabled at this formIO step, should not change
    "tentativeThesisTitle": "Tentative thesis title ",  // normal field
  }

  // should be "normal" fields used in this test
  const okFields = [
    'dateOfEnrolment',
    'tentativeThesisTitle',
    'dateOfCandidacyExam',
    'phdComment3'
  ]

  // should be the disabled one used in this test
  const disabledFields = [
    'phdStudentName',
  ]

  // we don't really want panels, so test it too
  const panelFields = [
    'sectionCProgressAssessment1',
  ]

  before(function () {
    dbCleaner.resetDatabase({}, () => {
      Factory.create("task");
    });

    const tasks = Tasks.find({}).fetch()
    assert.isNotEmpty(tasks)
    assert.isDefined(tasks[0].customHeaders?.formIO, JSON.stringify(tasks[0]))
    task = tasks[0]
  });

  it('should get the list of submittable fields only from a formIO definition', function () {
    const allowedKeys = findFieldKeysToSubmit(JSON.parse(task!.customHeaders.formIO!))

    assert.isNotEmpty(allowedKeys)

    okFields.forEach( (field) => assert.include(allowedKeys, field) )
    disabledFields.forEach( (field) => assert.notInclude(allowedKeys, field) )
    panelFields.forEach( (field) => assert.notInclude(allowedKeys, field) )
  })

  it('should return only submittable fields', function () {
    // TODO: finish this test

    const submittableFieldsOnly = filterUnsubmittableVars(
      dataToSubmit,
      task!.customHeaders?.formIO,
      [], []
    ) as string[]

    assert.isNotEmpty(submittableFieldsOnly)
    // okFields.forEach( (field) => assert.include(submittableFieldsOnly, field) )
    // disabledFields.forEach( (field) => assert.notInclude(submittableFieldsOnly, field) )
    // panelFields.forEach( (field) => assert.notInclude(submittableFieldsOnly, field) )
  });
})
