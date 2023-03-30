import {global_Error, Meteor} from "meteor/meteor"
import React from "react"
import _ from "lodash"
import {useTracker} from 'meteor/react-meteor-data'
import {Tasks} from "/imports/model/tasks";
import {WorkflowStarter} from './workflowStarter'
import {Button, Loader} from "@epfl/epfl-sti-react-library"
import {Link} from "react-router-dom"
import {Participant} from "/imports/ui/components/Participant";
import toast from "react-hot-toast";
import {
  canDeleteProcessInstance, canRefreshProcessInstance
} from "/imports/policy/tasks";
import {toastErrorClosable} from "/imports/ui/components/Toasters";
import {ITaskList} from "/imports/policy/tasksList/type";
import {useAccountContext} from "/imports/ui/contexts/Account";

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
  const toastId = `toast-${task._id}`

  return (
    <div className={'border-top p-2'} style={ {
      ...((user && user.isAdmin && task.isObsolete) && {backgroundColor: 'WhiteSmoke'})
    } }>
      <details>
        <summary className={'d-flex align-items-center'}>
          <span className={'mr-auto'}>
            <div className={'mr-2'}>{ task.variables.phdStudentName } {task.variables.phdStudentSciper ? `( ${task.variables.phdStudentSciper} )` : '' }</div>
            {task.created_at &&
              <span className={'mr-2 small'}>Created {task.created_at.toLocaleString('fr-CH')}</span>
            }
            {task.updated_at &&
              <span className={'small'}>Updated {task.updated_at.toLocaleString('fr-CH')}</span>
            }
            { user && user.isAdmin && task.isObsolete &&
              <span className={'small ml-2'}>Task is obsolete</span>
            }
          </span>
          <span className={'small'}>
            { task.monitorUri &&
              <a href={task.monitorUri} target="_blank" className={'pr-3'}>on Monitor <span
                className={"fa fa-external-link"}/></a>
            }
            { user && canDeleteProcessInstance(user) &&
              <span className={"mr-2"}>
                <CancelProcessButton processInstanceKey={ task.processInstanceKey } toastId={ toastId }/>
              </span>
            }
            { user && canRefreshProcessInstance(user) &&
              <span className={"mr-2"}>
                <RefreshProcessButton processInstanceKey={ task.processInstanceKey } toastId={ toastId }/>
              </span>
            }
            <Link className={''} to={`tasks/${task._id}`}>
              <Button
                label={'Proceed'}
                onClickFn={() => void 0}
              />
            </Link>
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

const CancelProcessButton = ({ processInstanceKey, toastId }: { processInstanceKey: string, toastId: string } ) => (
  <Button
    label={'Cancel process'}
    onClickFn={(event: React.FormEvent<HTMLButtonElement>) => {
      event.preventDefault();
      window.confirm('Delete the process instance?') &&
        Meteor.apply(
          // @ts-ignore, because doc is saying noRetry exists
          "deleteProcessInstance", [processInstanceKey], { wait: true, noRetry: true },
          (error: global_Error | Meteor.Error | undefined) => {
            if (error) {
              toastErrorClosable(toastId, `${error}`)
            } else {
              toast.success(`Successfully removed the process instance`)
            }
          }
        )
      }
    }
  />
)

const RefreshProcessButton = ({ processInstanceKey, toastId }: { processInstanceKey: string, toastId: string } ) => (
  <Button
    label={'Refresh'}
    onClickFn={(event: React.FormEvent<HTMLButtonElement>) => {
      event.preventDefault();
      window.confirm('Remove the process instance so it is refreshed after max 2 minutes ?') &&
        Meteor.apply(
          // @ts-ignore, because doc is saying noRetry exists
          "refreshProcessInstance", [processInstanceKey], { wait: true, noRetry: true },
          (error: global_Error | Meteor.Error | undefined) => {
            if (error) {
              toastErrorClosable(toastId, `${error}`)
            } else {
              toast.success(`Successfully refreshed the process instance by removing it from the app`)
            }
          }
        )
      }
    }
  />
)
