import React from "react"
import {ParticipantDetail} from "/imports/model/participants";

const allGoodBoxColor = 'bg-success text-white'
const awaitingBoxColor = 'bg-info text-white'

export type ParticipantsInfo = {
  role: string
  info?: ParticipantDetail
  isAssignee?: boolean  // is the current user the one awaited to fullfil the task
}

const camelCaseToLabel = (text: string) => text.replace(/([A-Z])/g, ' $1').replace(/^./, function(str: string){ return str.toUpperCase(); })

export const Participant = ({role, info, isAssignee}: ParticipantsInfo) =>
  <>
    {info &&
    <div className={`participant border col m-1 p-2 ${isAssignee ? awaitingBoxColor : allGoodBoxColor}`}>
      <div className={`small border-bottom border-white`}>{camelCaseToLabel(role)}</div>
      <div className={`small`}>{info.name} ({info.sciper})</div>
    </div>
    }
  </>
