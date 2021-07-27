import { Meteor } from 'meteor/meteor'
import { useTracker } from 'meteor/react-meteor-data'
import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUserShield } from '@fortawesome/free-solid-svg-icons'
import { Popper, PopperOptions } from './Popper'
import {User} from "/imports/model/user";

export function UserAuthButton() {
  const user: User | undefined = useTracker(() => Meteor.user() || undefined)

  const icon = ( user?.isAdmin) ? faUserShield : faUser

  const [visible, setVisibility] = useState<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popperOptions : PopperOptions = {
    placement: "left-start",
    modifiers: [
        {
          name: 'offset',
          options: {
            offset: [-25, 25],
          },
        }
      ]
  }

  return <>
    <button ref={buttonRef} onClick={() => setVisibility(!visible)}
            className="btn btn-secondary dropdown-toggle">
      <FontAwesomeIcon icon={icon} />
    </button>
    <Popper relativeTo={buttonRef.current} options={popperOptions} visible={visible}
            onClickElsewhere={() => setVisibility(false)}>
    <div className="dropdown-menu-popper p-2 mt-2">
      <p>
        Logged in as { user?.tequila?.displayname }
        { user?.isAdmin && ` (admin)` }
      </p>
      [Log out]
    </div>
    </Popper>
  </>
}
