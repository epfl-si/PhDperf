import chai, {assert} from 'chai'
import chaiDateTime from "chai-datetime";
chai.use(chaiDateTime);
import dayjs from "dayjs";

import {Task, Tasks} from "/imports/model/tasks";
import {
  StepsDefinitionDefault,
  StepsDefinitionV2
} from "/imports/ui/components/Dashboard/DefaultDefinition";
import {convertDefinitionToGraph} from "/imports/ui/components/Dashboard/DefinitionGraphed";

const dbCleaner = require("meteor/xolvio:cleaner");
const Factory = require("meteor/dburles:factory").Factory


describe('Unit tests Tasks', function () {
  beforeEach(function () {
    dbCleaner.resetDatabase({}, () => {
      Factory.create("task");
      Factory.create("task");
    });
  });

  it('should have at least a task', function () {
    const tasks = Tasks.find({})
    assert.notStrictEqual(tasks.count(), 0)
    // tasks.forEach(t => {
    //   // @ts-ignore
    //   const { customHeaders, variables, ...taskLight } = t
    //   console.log(taskLight)
    // })
  });

  // testing the test engine about dates, and how we are able to filter it with Mongo
  it('should be able to read and write dates', function () {
    Factory.create("task", {
        "journal.lastSeen": dayjs().subtract(15, 'days').toDate(),
      }
    )

    const tasks = Tasks.find({}).fetch()
    assert.isNotEmpty(tasks)

    tasks.forEach((task) => {
      assert.isDefined(task.journal.lastSeen)
      const lastSeen = new Date(task.journal.lastSeen!)
      assert.beforeOrEqualDate(lastSeen, new Date())
    })

    // can we find the obsolete one ?
    const obsoleteTasks = Tasks.find({
      "journal.lastSeen": { $lte: dayjs().subtract(1, 'day').toDate() },
    }).fetch()
    const notObsoleteTasks = Tasks.find({
      "journal.lastSeen": { $gte: dayjs().subtract(1, 'day').toDate() },
    }).fetch()

    assert.lengthOf(obsoleteTasks, 1)
    assert.isAbove(notObsoleteTasks.length, 1)
  });
});


describe('Unit tests Tasks dashboard definition', function () {
  let taskWithoutDefinition: Task | undefined
  let tasksWithDefinition: Task[]

  beforeEach(function () {
    dbCleaner.resetDatabase({}, () => {
      Factory.create("task", {
        "variables.dashboardDefinition": undefined
      });
      Factory.create("task", {
        "variables.dashboardDefinition": StepsDefinitionDefault
      });
      Factory.create("task", {
        "variables.dashboardDefinition": StepsDefinitionV2
      });
    });
  });

  it('should have a dashboard definition', function () {
    taskWithoutDefinition = Tasks.findOne({ 'variables.dashboardDefinition': { $exists: false } })
    tasksWithDefinition = Tasks.find({ 'variables.dashboardDefinition': { $exists: true } }).fetch()

    assert.isUndefined(taskWithoutDefinition?.variables.dashboardDefinition)

    tasksWithDefinition.forEach(
      (task) => {
        assert.isDefined(task.variables.dashboardDefinition)

        const definition = task.variables.dashboardDefinition
        assert(JSON.parse(JSON.stringify(definition)))  // test that it is some valid json
      }
    )
  });

  it('should have a dashboard definition graph-able', function () {
    tasksWithDefinition.forEach(
      (task) => {
        if (task.variables?.dashboardDefinition) {
          const graphedDefinition = convertDefinitionToGraph(task.variables.dashboardDefinition)
          assert(graphedDefinition)
          assert.isNotEmpty(graphedDefinition.nodes())
        }
      }
    )
  });
});
