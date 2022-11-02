import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUserShield } from '@fortawesome/free-solid-svg-icons'

import packageJson from '/package.json'
import {useAccountContext} from "/imports/ui/components/Account";
import { Popper, PopperOptions } from './Popper'


export function UserAuthButton() {
  const account = useAccountContext()
  const user = account?.user

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
    <div className="dropdown-menu-popper mt-3">
      <div className={'mx-3 my-3'}>
        <div>
          Logged in as { user?.tequila?.displayname }
          { user?.isAdmin && ` (admin)` }
        </div>
        { user?.isAdmin &&
        <div className={'small'}>
          Version {packageJson.version}
        </div>
        }
      </div>
    </div>
    </Popper>
  </>
}
