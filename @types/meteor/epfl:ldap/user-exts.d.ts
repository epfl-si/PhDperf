// https://forums.meteor.com/t/1-8-2-typescript-import-from-meteor-packages/50267/2

declare module 'meteor/epfl:ldap' {
  interface LDAPUser {
    displayName: string
    username: string
    sciper: string
    emails: string []
    accreds: {
      unitAcronym: string
      unitName: string
      phone: string
      office: string
      address: string
      position: string
      status: string
    }
  }
}
