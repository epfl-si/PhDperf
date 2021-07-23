import {Meteor} from "meteor/meteor"
import React from "react"
import _ from "lodash"
import {useTracker} from 'meteor/react-meteor-data'
import {PerfWorkflowTask, PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
import {WorkflowStarter} from './workflowStarter'
import {Button, Loader} from "epfl-sti-react-library"
import {Link} from "react-router-dom"

type TaskListElementProps = {
  task: PerfWorkflowTask
}

const TaskListElement = ({task}: TaskListElementProps) =>
  <div className={'border-top p-2'}>
    <details>
      <summary className={'d-flex align-items-center'}>
        {(task.assignee &&
          <span className={'mr-auto'}>Task for {task.assignee}</span>
          ||
          <span className={'mr-auto'}>Unassigned task</span>
        )}
        <span className={'small'}>
                          <a href={task.monitorUri} target="_blank" className={'pr-3'}>on Monitor <span
                            className={"fa fa-external-link"}/></a>
                          <Link className={''} to={`tasks/${task.key}`}><Button label={'Proceed'}
                                                                                onClickFn={() => void 0}/></Link>
                        </span>
      </summary>
      <pre><code>{task.detail}</code></pre>
    </details>
  </div>

export default function TaskList() {
  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, []);

  const tasks = useTracker(() => PerfWorkflowTasks.find({}).fetch())
  const groupByTasks = _.groupBy(tasks, 'title')

  return (
    <>
      <WorkflowStarter/>
      <h3 className={'mt-3'}>Tasks</h3>
      {listLoading ? (
        <Loader message={'Fetching tasks...'}/>
      ) : (
        <>
          {tasks.length > 0 ?
            Object.keys(groupByTasks).map((taskGrouper: string) => (
              <div key={taskGrouper}>
                <h4 className={'mt-5'}>{taskGrouper}</h4>
                {
                  groupByTasks[taskGrouper].map((task: PerfWorkflowTask) =>
                    <TaskListElement key={task.key} task={task}/>
                  )
                }
              </div>
            )) : (
              <p>There is no task waiting</p>
            )}
        </>
      )}
    </>
  )
}
