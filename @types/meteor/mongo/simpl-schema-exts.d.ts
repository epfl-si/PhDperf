// Lifted verbatim from https://github.com/serut/meteor-coverage-app-exemple/blob/master/Meteor-React-Typescript-Starter/%40types/meteor-collection2/index.d.ts

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

declare module "meteor/mongo" {
    // Works thanks to https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces
    module Mongo {

        type SchemaOptions = {
            /**
             * Set to `true` if your document must be passed through the collection's transform to properly validate
             */
            transform: boolean,
            /**
             * Set to `true` to replace any existing schema instead of combining
             */
            replace: boolean
        }

        interface Collection<T> {
            schema?: SimpleSchema;
            /**
             * Use this method to attach a schema to a collection created by another package,
             * such as Meteor.users. It is most likely unsafe to call this method more than
             * once for a single collection, or to call this for a collection that had a
             * schema object passed to its constructor.
             * @param ss SimpleSchema instance or a schema definition object from which to create a new SimpleSchema instance
             * @param options Options
             *
             */
            attachSchema(ss: SimpleSchema, options?: SchemaOptions): void;
        }
    }
}
