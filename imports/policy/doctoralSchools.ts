import {Meteor} from "meteor/meteor";

export const canEditDoctoralSchools = () : boolean => {
    return !!(Meteor.user()!.isAdmin || Meteor.user()?.isProgramAssistant)
}
