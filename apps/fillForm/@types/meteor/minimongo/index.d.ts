/**
 * Declare the LocalCollection.wrapTransform helper for use in TypeScript
 *
 * @see imports/model/user
 */

declare module "meteor/minimongo" {
    module LocalCollection {
        function wrapTransform<T, U>(f: (doc: T) => U): (doc: T) => U;
    }
}
