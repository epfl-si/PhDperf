import React from "react"
import {ParticipantDetail} from "/imports/model/participants";
import {ITaskList} from "/imports/policy/tasksList/type";
import {Task} from "/imports/model/tasks";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {Badge, Table} from "react-bootstrap";


const allGoodBoxColor = 'bg-info text-white'
const awaitingBoxColor = 'bg-awaiting text-white'

export type ParticipantsInfo = {
  role: string
  info?: ParticipantDetail
  isAssignee?: boolean  // is the current user the one awaited to fulfill the task
  showEmail?: boolean
}

// Label the participants
const varToNameMap: { [key: string]: string } = {
  programAssistant: 'Program assistant',
  phdStudent: 'Doctoral candidate',
  thesisDirector: 'Thesis director',
  thesisCoDirector: 'Thesis co-director',
  programDirector: 'Program director',
  mentor: 'Mentor',
}

export const camelCaseToLabelParticipant = (role: string): string => {
  if (role in varToNameMap) return varToNameMap[role]

  return role.replace(/([A-Z])/g, ' $1').replace(/^./, function(str: string){ return str.toUpperCase(); })
}

export const Participant = React.memo(
  ({role, info, isAssignee, showEmail = false}: ParticipantsInfo) =>
    <>
      {info &&
        <div className={`participant border col m-1 p-2 ${ isAssignee ? awaitingBoxColor : allGoodBoxColor}` }>
          <div className={`small border-bottom border-white`}>{ camelCaseToLabelParticipant(role) }</div>
          <div className={`small mt-1`}>{ info.lastNameUsage } { info.firstNameUsage } ({ info.sciper })</div>
          { showEmail &&
            <div className={`small`}>{ info.email }</div>
          }
        </div>
      }
    </>
)

export const ParticipantAsBodyTable = ({role, info, isAssignee, showEmail = false}: ParticipantsInfo) => <>
  { info &&
    <tr>
      <td>
        <svg className="icon" aria-hidden="true">
          <use xlinkHref="#user"></use>
        </svg>
      </td>
      <td>
        { camelCaseToLabelParticipant(role) }
      </td>
      <td className={ 'text-center' }>
        { isAssignee ?
          <Badge variant="warning" pill>Pending</Badge> :
          <></>
        }
      </td>
      <td>
        { info.lastNameUsage } { info.firstNameUsage }
      </td>
      <td>
        { info.sciper }
      </td>
      { showEmail &&
        <td><a href={ `mailto:${ info.email }` }>{ info.email }</a></td>
      }

    </tr>
  }
</>

export const ParticipantsAsTable = (
  {
    workflowInstanceTasks,
    showEmail = false,
    showStatusColor = true
  }: {
    workflowInstanceTasks:
      ITaskDashboard[],
    showEmail?: boolean,
    showStatusColor?: boolean,
  },
) => {
  // the majority of the data are the same for tasks in the workflow
  // so take the first one
  const task = workflowInstanceTasks[0]

  // compile all assignees into one list
  const assigneeList = workflowInstanceTasks.reduce(
    (acc: string[], task) => [...acc, ...task.assigneeScipers ?? []],
    [])

  return <>
    { task.participants &&
      <Table striped bordered className={ 'mb-4' }>
        <caption style={ { captionSide: 'top' } }>Participants</caption>
        <colgroup>
          <col style={ { width: '3%' } }/>
          <col style={ { width: '14%' } }/>
          <col style={ {} }/>
          <col style={ { width: '15%' } }/>
          <col style={ {} }/>
          <col style={ {} }/>
        </colgroup>
        <tbody>
          <tr>
            <th></th>
            <th>Role</th>
            <th className={ 'text-center' }>Task</th>
            <th>Name</th>
            <th>Sciper</th>
            <th>Email</th>
          </tr>

          { Object.entries(task.participants).map(([role, info]) =>
            <ParticipantAsBodyTable
              key={ `${ task._id }-${ role }` }
              role={ role }
              info={ info }
              isAssignee={ showStatusColor ? assigneeList?.includes(info?.sciper) : false }
              showEmail={ showEmail }
            />
          ) }
        </tbody>
      </Table>
    }</>
}

export const ParticipantsAsRow = ({
    task,
    showEmail = false,
    showStatusColor = true
  }: {
    task: ITaskList | Task
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
    = ( Array.isArray(task) ) ? task[0] : task

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
