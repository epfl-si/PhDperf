import { Meteor } from 'meteor/meteor'
import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Become } from 'meteor/epfl:become'
import { faUser, faUserClock, faUserShield } from '@fortawesome/free-solid-svg-icons'
import { Popper } from './Popper'

export function UserAuthButton() {
  const icon = (Meteor.user()?.isAdmin) ? faUserShield :
    Become.realUser() ? faUserClock : faUser

  const [visible, setVisibility] = useState<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popperOptions = {
    placement: "bottom-end",
  }

  return <>
    <button ref={buttonRef} onClick={() => setVisibility(!visible)}><FontAwesomeIcon icon={icon} /></button>
    <Popper relativeTo={buttonRef.current} options={popperOptions} visible={visible}
            onClickElsewhere={() => setVisibility(false)}>
    <p>Hello</p>
    </Popper>
  </>
}
