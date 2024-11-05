import {Meteor} from "meteor/meteor";
import {Tasks} from "/imports/model/tasks";
import { ReactiveAggregate } from 'meteor/tunguska:reactive-aggregate';


Meteor.publish('tasksDashboardProcessInstance', function () {
  ReactiveAggregate(this, Tasks, [
      {
        $match:
          {
            processInstanceKey: {
              $exists: true
            }
          }
      },
      {
        $group: {
          _id: "$processInstanceKey",
          tasks: {
            $push: "$$ROOT"
          },
          created_at: {
            $mergeObjects: {
              create_at: "$variables.created_at"
            }
          }
        }
      }
  ],
  { clientCollection: 'processInstancesDashboard' }
  );
})
