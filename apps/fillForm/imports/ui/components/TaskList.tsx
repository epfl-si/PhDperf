import {global_Error, Meteor} from "meteor/meteor"
import React from "react"
import _ from "lodash"
import {useTracker} from 'meteor/react-meteor-data'
import {Tasks} from "/imports/model/tasks";
import {WorkflowStarter} from './workflowStarter'
import {Button, Loader} from "@epfl/epfl-sti-react-library"
import {Link, useNavigate} from "react-router-dom"
import {Participant} from "/imports/ui/components/Participant";
import toast from "react-hot-toast";
import Dropdown from 'react-bootstrap/Dropdown'
import {
  canDeleteProcessInstance,
  canEditParticipants as canEditParticipantsCheck,
  canRefreshProcessInstance
} from "/imports/policy/tasks";
import {toastErrorClosable} from "/imports/ui/components/Toasters";
import {ITaskList} from "/imports/policy/tasksList/type";
import {useAccountContext} from "/imports/ui/contexts/Account";
import {TaskInfo} from "/imports/ui/components/Task/Info";


export default function TaskList() {
  const account = useAccountContext()

  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasksList');
    return !handle.ready();
  }, []);

  const tasks = useTracker(() => Tasks.find({}).fetch() as ITaskList[])
  const groupByTasks = _.groupBy(tasks, 'customHeaders.title')

  if (!account || !account.isLoggedIn || !account.user) return (<Loader message={'Loading your data...'}/>)

  return (
    <>
      <WorkflowStarter/>

      {listLoading ? (
        <Loader message={'Fetching tasks...'}/>
      ) : (
        <>
          {tasks.length > 0 ?
            Object.keys(groupByTasks).map((taskGrouper: string) => (
              <div key={taskGrouper}>
                <h3 className={'mt-5'}>{taskGrouper}</h3>
                {
                  groupByTasks[taskGrouper].map((task) =>
                    <TaskRow key={task._id} task={task} user={ account.user! }/>
                  )
                }
              </div>
            ))
            : (
              <p>There is currently no task waiting your input</p>
            )}
        </>
      )}
    </>
  )
}

const TaskRow = ({ task, user }: { task: ITaskList, user: Meteor.User }) => {
  const navigate = useNavigate();

  const canDelete = user && canDeleteProcessInstance(user)
  const canRefresh = user && canRefreshProcessInstance(user)
  const canEditParticipants = user && canEditParticipantsCheck(user)

  return (
    <div className={'border-top p-2'} style={ {
      ...((user && user.isAdmin && task.isObsolete) && {backgroundColor: 'WhiteSmoke'})
    } }>
      <details>
        <summary className={'d-flex align-items-center'}>
          <TaskInfo task={ task }/>
          <span className={'small'}>
            <Link className={''} to={`tasks/${task._id}`}>
              <Button
                label={'Proceed'}
                onClickFn={() => void 0}
              />
            </Link>
            { (canRefresh || canDelete || canEditParticipants) &&
              <span className={"ml-1"}>
                <Dropdown as="span">
                  <Dropdown.Toggle
                    variant="secondary"
                    id="dropdown-task-row-actions"
                    style={{
                      height: '2.5em',
                      padding: '0',
                    }}
                  >⋮
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Header>
                      <div>Action on</div>
                      <div className={''}>Job { task._id }</div>
                      <div className={''}>Process { task.processInstanceKey }</div>
                      { task.monitorUri &&
												<a href={task.monitorUri} target="_blank" className={'pr-3'}>on Monitor <span
													className={"fa fa-external-link"}/></a>
                      }
                    </Dropdown.Header>
                    <Dropdown.Divider/>
                    { canEditParticipants &&
											<Dropdown.Item
												className={'small'}
												onSelect={ () => navigate(`workflows/${ task.processInstanceKey  }`) }
											>
                        <>Edit workflow</>
											</Dropdown.Item>
                    }
                    { canRefresh &&
                      <Dropdown.Item
                        className={'small'}
                        eventKey={ task.processInstanceKey }
                        onSelect={ refreshProcessInstance }
                      >Refresh
                      </Dropdown.Item>
                    }
                    { canDelete &&
                      <Dropdown.Item
                        className={'small'}
                        eventKey={ task.processInstanceKey }
                        onSelect={ cancelProcessInstance }
                      >Cancel
                      </Dropdown.Item>
                    }
                  </Dropdown.Menu>
                </Dropdown>
              </span>
            }
          </span>
        </summary>
        <pre><code>{task.detail}</code></pre>
        { user &&
          <div className={'container'}>
            <div className="row">
              {task.participants &&
                Object.entries(task.participants).map(([role, info]) =>
                  <Participant
                    key={`${task._id}-${role}`}
                    role={role}
                    info={info}
                    isAssignee={task.assigneeScipers?.includes(info?.sciper)}
                  />
                )
              }
            </div>
          </div>
        }

      </details>
    </div>
  )
}


const refreshProcessInstance = (eventKey: any) => {
  window.confirm('Remove the process instance so it is refreshed after max 2 minutes ?') &&
  Meteor.apply(
    // @ts-ignore, because doc is saying noRetry exists
    "refreshProcessInstance", [eventKey], { wait: true, noRetry: true },
    (error: global_Error | Meteor.Error | undefined) => {
      if (error) {
        toastErrorClosable(eventKey, `${error}`)
      } else {
        toast.success(`Successfully refreshed the process instance. Please wait some time while the new tasks are being created`)
      }
    }
  )
}

const cancelProcessInstance = (eventKey: any) => {
  window.confirm('Delete the process instance?') &&
  Meteor.apply(
    // @ts-ignore, because doc is saying noRetry exists
    "deleteProcessInstance", [eventKey], { wait: true, noRetry: true },
    (error: global_Error | Meteor.Error | undefined) => {
      if (error) {
        toastErrorClosable(eventKey, `${error}`)
      } else {
        toast.success(`Successfully removed the process instance`)
      }
    }
  )
}
