import React from "react"
import {TaskParticipant} from "/imports/ui/model/perf-workflow-tasks";

const allGoodBoxColor = 'bg-success text-white'
const awaitingBoxColor = 'bg-info text-white'

type ParticipantProps = {
  user: TaskParticipant
}

export const Participant = ({user}: ParticipantProps) => {
  return (
    <>
      {user.sciper &&
      <div className={`participant border m-1 p-2 ${user.isAssignee ? awaitingBoxColor : allGoodBoxColor}`}>
        <div className={`small border-bottom border-white`}>Role: {user.role}</div>
        <div className={`small`}>Sciper: {user.sciper}</div>
        <div className={`small`}>Display name: {user.displayName}</div>
      </div>
      }
    </>
  )
}
