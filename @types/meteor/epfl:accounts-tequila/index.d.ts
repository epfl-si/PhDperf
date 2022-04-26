// https://forums.meteor.com/t/1-8-2-typescript-import-from-meteor-packages/50267/2

declare module 'meteor/epfl:accounts-tequila' {
    namespace Tequila {
        function start(options?: any): void
        const defaultOptions: any
    }
    export default Tequila
}
