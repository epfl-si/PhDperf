import {Meteor} from "meteor/meteor";
import {canEditAtLeastOneDoctoralSchool, canEditDoctoralSchool} from "/imports/policy/doctoralSchools";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";


Meteor.publish('doctoralSchools', function() {
  let user: Meteor.User | null = null
  if (this.userId) {
    user = Meteor.users.findOne({_id: this.userId}) ?? null
  }

  if (user && canEditAtLeastOneDoctoralSchool(user)) {
    const sub = DoctoralSchools.find({}).observeChanges({
      added: (id, data) => {
        const ds = DoctoralSchools.findOne({_id: id});
        this.added('doctoralSchools', id, {...data, readonly: !(ds && canEditDoctoralSchool(user, ds))});
      },
      changed : (id, data) => {
        const ds = DoctoralSchools.findOne({_id: id});
        this.changed('doctoralSchools', id, {...data, readonly: !(ds && canEditDoctoralSchool(user, ds))});
      },
      removed : (id) => {
        this.removed('doctoralSchools', id);
      }
    });
    this.onStop(() => {
      sub.stop();
    });
    this.ready();
  } else {
    this.ready()
  }
})
