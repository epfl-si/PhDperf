import React from "react"
import { Drawer, Logo } from "epfl-sti-react-library"
import { UserAuthButton } from "./UserAuthButton"

export function PhDHeader() {
  return (
    <header role="banner" className="header">
      <Drawer contents={{link: "https://www.epfl.ch", anchor: "Go to main site"}} />
      <Logo />
      <nav className='ml-auto'>
        <UserAuthButton />
      </nav>
    </header>
  )
}
