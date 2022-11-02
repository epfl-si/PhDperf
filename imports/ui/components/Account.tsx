/**
 * Provde a reactive context for user info
 */

import React, {useContext} from 'react'
import {createContext} from "react";
import {useTracker} from 'meteor/react-meteor-data'

import {User} from "/imports/model/user";


interface AccountContextInterface {
  user: User | null;
  userId: string | null;
  isLoggedIn: boolean;
}

const useAccount = () => useTracker(() => {
  const user = Meteor.user() as User
  const userId = Meteor.userId()
  return {
    user,
    userId,
    isLoggedIn: !!userId
  }
}, [])

export const AccountContext = createContext<AccountContextInterface | null>(null)

export const AccountProvider = (props: any) => (
  <AccountContext.Provider value={useAccount()}>
    {props.children}
  </AccountContext.Provider>
)

export const useAccountContext = () => useContext(AccountContext)
