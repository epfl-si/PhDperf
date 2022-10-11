/**
 * Improve the Meteor.Users collection.
 *
 * This provides the following API extensions:
 *
 * User.transform.addComputedField(k, f)
 *
 *    Declare that field `k` of User objects is to be computed by `f(user)`,
 *    where f must be a synchronous function
 *
 * User#isAdmin
 *
 *    Setting this field (using a call to `User.Transform.addComputedField("isAdmin", ...)`)
 *    describes which users are administrators (see below)
 *
 * Additionally, loading this module into your Meteor application causes a `user.data`
 * collection to be published (on the server side) / subscribed to (client). In this
 * collection, administrators (in the sense of `User#isAdmin`, above) get disclosure
 * about all users known to Meteor (i.e. persisted in the Meteor.Users collection);
 * while non-administrators only get their own user object back (thus informing them
 * that they are not administrators).
 */
import _ from 'lodash'

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { LocalCollection } from 'meteor/minimongo'
import SimpleSchema from 'simpl-schema'

import debug_ from 'debug'
const debug = debug_('phd-assess:model:user')

/* We will be applying the trick of
   https://stackoverflow.com/a/41517850/435004, therefore we need to
   grapple at the private _transform field: */
declare module "meteor/mongo" {
  module Mongo {
    interface Collection<T, U> {
      _transform: (from: T) => U
    }
  }
}

class Transform<T> {
    private computedFields : Array<{k: string, f: (transform: T) => any}> = []

    constructor(private collection: Mongo.Collection<T>) {
        this.collection._transform =
            LocalCollection.wrapTransform((item: T) => {
                for (let c of this.computedFields) {
                    (item as any)[c.k] = c.f(item)
                }
                return item
            })
    }

    public addComputedField (k: string, f: (item: T) => any) {
        this.computedFields.push({k, f})
    }
}

// Like Meteor.users, sans type shenanigans:
const MeteorUsers = <Mongo.Collection<Meteor.User>> Meteor.users

export class User {
    public _id : string | null = null
    public isAdmin: boolean = false
    public tequila?: {
      provider: string | ""
      email: string
      displayname: string
      firstname: string
      name: string
      personaltitle: string
      group: string | ""
      user: string
      org: string
    }

    static null() : User {
        return User.cast({ _id: null, isAdmin: false })
    }

    static byId(_id: string): User {
        return _.extend(User.null(),
                        (Meteor.users.findOne({_id}) || { _id }))
    }

    static me(): User | null {
      const userId = Meteor.userId()
      return userId == null ? null : User.byId(userId)
    }

    static Schema = new SimpleSchema({
        // Let Meteor do its thing e.g. for session tokens
        // Taken from https://github.com/aldeed/meteor-collection2#attach-a-schema-to-meteorusers
        services: {
            type: Object,
            optional: true,
            blackbox: true
        },

        // `profile` is a feature of Meteor.User; it is "self-service" in
        // the sense that the field is autopublished, and writes to one's
        // own profile are accepted (provided they match the `deny` rules,
        // i.e. in our case, the schema). See
        // https://docs.meteor.com/api/accounts.html#Meteor-user
        profile: <any>Object,   // Just `Object,` makes TypeScript cry for no good reason :(
        'profile.language': {
            type: String,
            allowedValues: ["en", "fr"]
        }
    })

    public static transform = new Transform(MeteorUsers)

    static cast (userDetails : any) : User {
        return _.extend(new User(), userDetails)
    }
}

MeteorUsers.attachSchema(User.Schema)

const MeteorUsersCollectionName = 'users'
const UsersDataPubName = 'users.data'

// Disclose part of the Meteor.users collection to authenticated users
// Administrators get all users and names
// All users get told whether they are an administrator themselves or not
if (Meteor.isServer) {
    import('/imports/lib/map-cursor').then(/* Fiber'd */ function({ MapCursor }) {
        Meteor.publish(UsersDataPubName, function() {
            const user = Meteor.user(),
                  userId = this.userId
            if (! (user && userId)) return
            const isAdmin = user.isAdmin

            debug(`Disclosing %s to ${userId}`,
                  isAdmin ? "all users' personal data" : "their own personal data")
            return new MapCursor(
                Meteor.users.find({_id: userId}),
                (changes: any, id: string) => {
                    if (id === userId) {
                        changes.isAdmin = isAdmin
                        return changes
                    } else {
                        return _.pick(changes, ['_id', 'tequila'])  // disclosed
                    }
                },
                MeteorUsersCollectionName)
        })
    })
} else {
    Meteor.subscribe(UsersDataPubName)
}
