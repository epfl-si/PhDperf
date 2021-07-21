import { Meteor } from 'meteor/meteor'
import { useTracker } from 'meteor/react-meteor-data'
import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Become } from 'meteor/epfl:become'
import { faUser, faUserClock, faUserShield } from '@fortawesome/free-solid-svg-icons'
import { Popper, PopperOptions } from './Popper'
import {User} from "/imports/model/user";

export function UserAuthButton() {
  const user: User | undefined = useTracker(() => Meteor.user() || undefined)

  const icon = ( user?.isAdmin) ? faUserShield :
    Become.realUser() ? faUserClock : faUser

  const [visible, setVisibility] = useState<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popperOptions : PopperOptions = {
    placement: "left-end",
  }

  return <>
    <button ref={buttonRef} onClick={() => setVisibility(!visible)}
            className="btn btn-secondary dropdown-toggle">
      <FontAwesomeIcon icon={icon} />
    </button>
    <Popper relativeTo={buttonRef.current} options={popperOptions} visible={visible}
            onClickElsewhere={() => setVisibility(false)}>
    <div className="dropdown-menu-popper p-1 mt-2">
      <p>
        Logged in as { user?.tequila?.user }
        { user?.isAdmin && ` (admin)` }
      </p>
      <button className="btn btn-secondary">Log out</button>
    </div>
    </Popper>
  </>
}
