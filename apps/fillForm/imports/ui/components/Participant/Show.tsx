import React from "react"
import {ParticipantDetail} from "/imports/model/participants";
import {ITaskList} from "/imports/policy/tasksList/type";
import {Task} from "/imports/model/tasks";


const allGoodBoxColor = 'bg-info text-white'
const awaitingBoxColor = 'bg-awaiting text-white'

export type ParticipantsInfo = {
  role: string
  info?: ParticipantDetail
  isAssignee?: boolean  // is the current user the one awaited to fullfil the task
  showEmail?: boolean
}

const camelCaseToLabel = (text: string) => text.replace(/([A-Z])/g, ' $1').replace(/^./, function(str: string){ return str.toUpperCase(); })

export const Participant = React.memo(
  ({role, info, isAssignee, showEmail = false}: ParticipantsInfo) =>
    <>
      {info &&
        <div className={`participant border col m-1 p-2 ${ isAssignee ? awaitingBoxColor : allGoodBoxColor}` }>
          <div className={`small border-bottom border-white`}>{ camelCaseToLabel(role) }</div>
          <div className={`small mt-1`}>{ info.name } ({ info.sciper })</div>
          { showEmail &&
            <div className={`small`}>{ info.email }</div>
          }
        </div>
      }
    </>
)

export const ParticipantsAsRow = (
  { task,
    showEmail = false,
    showStatusColor = true
  }: {
    task:  ITaskList | Task,
    showEmail?: boolean,
    showStatusColor?: boolean,
  },
) => {
  return <div className="row">
    { task.participants &&
      Object.entries(task.participants).map(([role, info]) =>
        <Participant
          key={ `${ task._id }-${ role }` }
          role={ role }
          info={ info }
          isAssignee={ showStatusColor ? task.assigneeScipers?.includes(info?.sciper) : false }
          showEmail={ showEmail }
        />
      )
    }
  </div>
}
