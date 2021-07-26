import debug_ from 'debug'
import {LDAPUser} from "meteor/epfl:ldap";

const debug = debug_('server/ldap')

let ldapContext = require('epfl-ldap')({poolSize: 10});

export default function getUserBySciper(sciper: string, onSuccess: (user: LDAPUser) => void) {
  debug(`asking to fetch LDAP for ${sciper}`)

  ldapContext.users.getUserBySciper(sciper, function (err: any, data: LDAPUser) {
    if (err) {
      debug(`Unable to crawl lDAP for user info (sciper ${sciper})`)
    }
    else {
      debug(JSON.stringify(data, null, 2));
      onSuccess(data)
    }
  })
}
