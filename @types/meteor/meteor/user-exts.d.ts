/**
 * Additional fields in the Meteor.User objects
 *
 * @see imports/model/user
 */

declare module "meteor/meteor" {
    module Meteor {
        interface User {
            displayname: string
            isAdmin: boolean
            tequila: { user: string }
        }
    }
}
