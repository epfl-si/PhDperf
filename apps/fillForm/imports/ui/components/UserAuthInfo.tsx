import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUserShield } from '@fortawesome/free-solid-svg-icons'

import {Loader} from "@epfl/epfl-sti-react-library";

import packageJson from '/package.json'
import {useAccountContext} from "/imports/ui/contexts/Account";
import { Popper, PopperOptions } from './Popper'


export const UserAuthInfo = () => {
  const account = useAccountContext()

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

  if (!account || !account.user) return (<Loader></Loader>)

  return <>
    <button ref={buttonRef} onClick={() => setVisibility(!visible)}
            className="btn btn-secondary dropdown-toggle">
      <FontAwesomeIcon icon={ account.user.isAdmin ? faUserShield : faUser } />
    </button>
    <Popper relativeTo={buttonRef.current} options={popperOptions} visible={visible}
            onClickElsewhere={() => setVisibility(false)}>
    <div className="dropdown-menu-popper mt-3">
      <div className={'mx-3 my-3'}>
        <div>
          Logged in as { account.user.tequila?.displayname }
          { account.user.isAdmin && ` (admin)` }
        </div>
        { account.user.isAdmin &&
        <div className={'small'}>
          Version {packageJson.version}
        </div>
        }
      </div>
    </div>
    </Popper>
  </>
}
