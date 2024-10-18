import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUserGear } from '@fortawesome/free-solid-svg-icons'

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
    <button
      ref={buttonRef}
      onClick={() => setVisibility(!visible)}
      className="btn btn-secondary dropdown-toggle"
      id={'user-info-button'}
    >
      <FontAwesomeIcon icon={
        ( account.user.isAdmin || account.user.isUberProgramAssistant ) ? faUserGear : faUser
      } />
    </button>
    <Popper relativeTo={buttonRef.current} options={popperOptions} visible={visible}
            onClickElsewhere={() => setVisibility(false)}>
    <div className="dropdown-menu-popper mt-3">
      <div className={'mx-3 my-3 text-center'}>
        <div id={'user-info'}>
          <span id={'user-info-displayname'}>{ account.user.tequila?.displayname }</span>
          {
            ( account.user.isAdmin || account.user.isUberProgramAssistant ) &&
              <div id={ 'user-info-status' } className={ 'small' }>
                { account.user.isAdmin && 'Admin' }
                { account.user.isUberProgramAssistant && 'Program assistants manager' }
              </div>
          }
        </div>
        { ( account.user.isAdmin || account.user.isUberProgramAssistant ) &&
        <div id={'application-version'} className={'small'}>
          { packageJson.version }
        </div>
        }
      </div>
    </div>
    </Popper>
  </>
}
