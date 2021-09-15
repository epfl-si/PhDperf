import {global_Error, Meteor} from "meteor/meteor"
import React from "react"
import _ from "lodash"
import {useTracker} from 'meteor/react-meteor-data'
import {Task, Tasks} from '/imports/api/tasks'
import {WorkflowStarter} from './workflowStarter'
import {Button, Loader} from "@epfl/epfl-sti-react-library"
import {Link} from "react-router-dom"
import {Participant} from "/imports/ui/components/Participant";
import toast from "react-hot-toast";

type TaskProps = {
  task: Task
}

function Task({task}: TaskProps) {
  return (
    <div className={'border-top p-2'}>
      <details>
        <summary className={'d-flex align-items-center'}>
          <span className={'mr-auto small'}>
            <span className={'mr-1'}>Created by {task.variables.created_by}</span>
            <span className={'mr-1'}>Created {task.created_at?.toLocaleString('fr-CH')}</span>
            <span>Updated {task.updated_at?.toLocaleString('fr-CH')}</span>
          </span>
          <span className={'small'}>
            { task.monitorUri &&
              <a href={task.monitorUri} target="_blank" className={'pr-3'}>on Monitor <span
                className={"fa fa-external-link"}/></a>
            }
            { Meteor.user()?.isAdmin &&
              <span className={"mr-1"}>
                <Button
                  label={'Cancel process'}
                  onClickFn={(event: React.FormEvent<HTMLButtonElement>) => {
                      event.preventDefault();
                      if (window.confirm('Delete the process instance?')) {
                        Meteor.apply(
                          // @ts-ignore, because doc is saying noRetry exists
                          "deleteProcessInstance", [task.key, task.processInstanceKey], { wait: true, noRetry: true },
                          (error: global_Error | Meteor.Error | undefined) => {
                            if (error) {
                              toast.error(`${error}`)
                            } else {
                              toast.success(`Successfully removed the process instance`)
                            }
                          }
                        )
                      }
                    }
                  }
                />
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

        <div className={'container'}>
          <div className="row">
          {task.participants &&
            task.participants.map((participant) => (
                <Participant
                  key={`${task._id}-${participant.role}`}
                  {...participant}
                />
            )
          )}
          </div>
        </div>

      </details>
    </div>
  )
}

export default function TaskList() {
  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, []);

  const tasks = useTracker(() => Tasks.find({}).fetch())
  const groupByTasks = _.groupBy(tasks, 'customHeaders.title')

  return (
    <>
      {
        Meteor.user()?.isAdmin &&
        <WorkflowStarter/>
      }
      {listLoading ? (
        <Loader message={'Fetching tasks...'}/>
      ) : (
        <>
          {tasks.length > 0 ?
            Object.keys(groupByTasks).map((taskGrouper: string) => (
              <div key={taskGrouper}>
                <h3 className={'mt-5'}>{taskGrouper}</h3>
                {
                  groupByTasks[taskGrouper].map((task: Task) =>
                    <Task key={task._id} task={task}/>
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
