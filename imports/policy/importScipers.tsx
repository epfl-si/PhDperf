import {Meteor} from "meteor/meteor";
import {DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {getAssistantAdministrativeMemberships} from "/imports/policy/tasks";


/**
 * Whether the currently logged-in user can import SCIPERs from any doctoral school
 *
 */
export const canImportScipersFromISA = () : boolean => {
  const user = Meteor.user();
  if (! user) return false;
  if (user.isAdmin || user.isUberProgramAssistant) return true;
  const doctoralSchools = DoctoralSchools.find({}).fetch();
  return Object.keys(getAssistantAdministrativeMemberships(user, doctoralSchools)).length > 0
}
