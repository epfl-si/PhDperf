// https://forums.meteor.com/t/1-8-2-typescript-import-from-meteor-packages/50267/2

declare module 'meteor/epfl:become' {
    export namespace Become {
        function become(targetUserID: string, opt_callback?: Function) : void
        // https://stackoverflow.com/a/51114250/435004
        function realUser() : import("meteor/meteor").Meteor.User
        function restore() : void
    }
}
