import {Meteor} from "meteor/meteor"
import React from "react"
import _ from "lodash"
import {useTracker} from 'meteor/react-meteor-data'
import {Task, Tasks} from '/imports/api/tasks'
import {WorkflowStarter} from './workflowStarter'
import {Button, Loader} from "epfl-sti-react-library"
import {Link} from "react-router-dom"

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
            <span className={'mr-1'}>Created {task.variables.created_at?.toLocaleString('fr-CH')}</span>
            <span>Updated {task.variables.updated_at?.toLocaleString('fr-CH')}</span>
          </span>
          <span className={'small'}>
            <a href={task.monitorUri} target="_blank" className={'pr-3'}>on Monitor <span
              className={"fa fa-external-link"}/></a>
            <Link className={''} to={`tasks/${task._id}`}><Button label={'Proceed'}
                 onClickFn={() => void 0}/></Link>
          </span>
        </summary>
        <pre><code>{task.detail}</code></pre>

{/*
        {task.variables.participants &&
          task.variables.participants.map((participant) => (
              <Participant
                key={`${task._id}-${participant.role}`}
                role={participant}
                detail={participant.}
              />
          )
        )}
*/}

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
