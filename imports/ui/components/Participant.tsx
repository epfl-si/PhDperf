import React from "react"
import {Sciper} from "/imports/api/datatypes";

const allGoodBoxColor = 'bg-success text-white'
const awaitingBoxColor = 'bg-info text-white'

type ParticipantProps = {
  role: string
  sciper: Sciper
  info: any
  isAssignee: boolean  // is the current user the one awaited to fullfil the task
}

export const Participant = ({role, sciper, info, isAssignee}: ParticipantProps) => {
  return (
    <>
      {info.sciper &&
      <div className={`participant border m-1 p-2 ${isAssignee ? awaitingBoxColor : allGoodBoxColor}`}>
        <div className={`small border-bottom border-white`}>Role: {role}</div>
        <div className={`small`}>Sciper: {sciper}</div>
        <div className={`small`}>Display name: {info["name"]}</div>
      </div>
      }
    </>
  )
}
