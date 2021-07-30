import React from "react"

const allGoodBoxColor = 'bg-success text-white'
const awaitingBoxColor = 'bg-info text-white'
const nothingBoxColor = 'bg-light'

export const Participant = ({user, role, isAssignee}) => {
  return (
    <>
      {user.length != 0 &&
      <div className={`participant border m-1 p-2 ${isAssignee ? awaitingBoxColor : allGoodBoxColor}`}>
        <div className={`small border-bottom border-white`}>{role}</div>
        <div className={`small`}>{user.displayName}</div>
      </div>
      }
      {user.length == 0 &&
      <div className={`participant small border m-1 p-2 ${nothingBoxColor}`}>
        <div className={`small border-bottom border-white`}>{role}</div>
        <div>None</div>
      </div>
      }
    </>
  )
}
