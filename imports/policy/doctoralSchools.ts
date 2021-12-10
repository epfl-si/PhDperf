import {Meteor} from "meteor/meteor";

export const canAccessDoctoralSchoolEdition = () : boolean => {
    return (Meteor.user()!.isAdmin)
}
