import {Meteor} from "meteor/meteor";

export const canImportScipersFromISA = () : boolean => {
  return !!(Meteor.user()!.isAdmin || Meteor.user()?.isProgramAssistant)
}
