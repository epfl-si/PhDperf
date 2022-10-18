import {Meteor} from "meteor/meteor";
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {getAssistantAdministrativeMemberships} from "/imports/policy/tasks";

/**
 * Whether the current user can edit this particular doctoral school.
 */
export const canEditDoctoralSchool = (doctoralSchool: DoctoralSchool) : boolean => {
  if (canCreateDoctoralSchool()) return true;
  const user = Meteor.user();
  if (! user) return false;

  return Object.keys(getAssistantAdministrativeMemberships(user, [doctoralSchool])).length > 0
}

/**
 * Whether the current user can create doctoral schools.
 *
 * This requires some kind of transversal / uber or super-user permission.
 */
export const canCreateDoctoralSchool = () : boolean => {
  const user = Meteor.user();
  if (! user) return false;
  return user.isAdmin || user.isUberProgramAssistant;
}

/**
 * Whether the current user can edit at least one doctoral school.
 *
 * This is used to elide the relevant menu entry.
 */
export const canEditAtLeastOneDoctoralSchool = () : boolean => {
  if (canCreateDoctoralSchool()) return true;
  const user = Meteor.user();
  if (! user) return false;
  if (user.isAdmin || user.isUberProgramAssistant) return true;
  return Object.keys(getAssistantAdministrativeMemberships(user, DoctoralSchools.find({}).fetch())).length > 0
}
