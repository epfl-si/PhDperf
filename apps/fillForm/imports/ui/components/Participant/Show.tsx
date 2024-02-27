import React from "react"
import {ParticipantDetail} from "/imports/model/participants";
import {ITaskList} from "/imports/policy/tasksList/type";
import {Task} from "/imports/model/tasks";
import { ITaskDashboard } from "/imports/policy/dashboard/type";


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

/**
 * Show all task(s) participants as a row
 * @param task - Accept array of tasks (that should be, by design, in the same workflow).
 *             When it is an array, all the assignees of all tasks are checked to get the good assignees colors
 * @param showEmail - Add the email info
 * @param showStatusColor - Get the color corresponding of an assignee
 */
export const ParticipantsAsRow = (
  { task,
    showEmail = false,
    showStatusColor = true
  }: {
    task: ITaskList |
      Task |
      ITaskDashboard |
      ITaskDashboard[],
    showEmail?: boolean,
    showStatusColor?: boolean,
  },
) => {

  // compile all assignees
  const assigneeScipers: string[] = ( Array.isArray(task) ) ?
    task.flatMap(
        t => t.assigneeScipers ? t.assigneeScipers : []
    ) :
    task.assigneeScipers ?? []

  // convert any array to one task
  const _task:
    ITaskList |
    Task |
    ITaskDashboard
    = ( Array.isArray(task) ) ? task = task[0] : task

  return <div className={ `row flex-nowrap` }>
    { _task.participants &&
      Object.entries(_task.participants).map( ( [role, info] ) =>
        <Participant
          key={ `${ _task._id }-${ role }` }
          role={ role }
          info={ info }
          isAssignee={ showStatusColor ? assigneeScipers.includes(info?.sciper) : false }
          showEmail={ showEmail }
        />
      )
    }
  </div>
}
