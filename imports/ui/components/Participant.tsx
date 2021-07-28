import React from "react"

const allGoodBoxColor = 'bg-success text-white'
const awaitingBoxColor = 'bg-info text-white'
const nothingBoxColor = 'bg-light'

export const Participant = ({user, role, isAssignee}) => {
  return (
    <>
      {user.length != 0 &&
      <div className={`border m-2 p-3 ${isAssignee ? awaitingBoxColor : allGoodBoxColor}`}>
        <div className={`border-bottom border-white`}>{role}</div>
        <div>{user.displayName}</div>
      </div>
      }
      {user.length == 0 &&
      <div className={`border m-2 p-3 ${nothingBoxColor}`}>
        <div className={`border-bottom border-white`}>{role}</div>
        <div>Not setted</div>
      </div>
      }
    </>
  )
}
