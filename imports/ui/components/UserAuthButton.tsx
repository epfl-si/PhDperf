import { Meteor } from 'meteor/meteor'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Become } from 'meteor/epfl:become'
import { faUser, faUserClock, faUserShield } from '@fortawesome/free-solid-svg-icons'

export function UserAuthButton() {
  const icon = (Meteor.user()?.isAdmin) ? faUserShield :
    Become.realUser() ? faUserClock : faUser

  return <p><FontAwesomeIcon icon={icon} /></p>
}
