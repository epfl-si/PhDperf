import {Meteor} from "meteor/meteor"
import React from "react"
import {useTracker} from 'meteor/react-meteor-data'
import {PerfWorkflowTask, PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
import {WorkflowStarter} from './workflowStarter'
import {Button, Loader} from "epfl-sti-react-library"
import {Link} from "react-router-dom"

export default function TaskList() {
  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasks');
    return !handle.ready();
  }, []);

  const tasks = useTracker(() => PerfWorkflowTasks.find({}).fetch())

  return (
    <>
      <WorkflowStarter />
      <h4>Tasks</h4>
      {listLoading ? (
        <Loader message={'Fetching tasks...'}/>
      ) : (
        <>
            {tasks.length > 0 ? tasks.map(
              (task: PerfWorkflowTask) =>
                <div key={task.key}>

                  <div className={''}>
                    <details >
                      <summary className={'d-flex align-items-center'}>
                        <span className={'mr-auto'}>{task.getName()}</span>
                        <span className={'small'}>
                          <a href={task.getMonitorUri()} target="_blank" className={'pr-3'}>on Monitor <span className={"fa fa-external-link"}/></a>
                          <Link className={''} to={`tasks/${task.key}`}><Button label={'Proceed'} onClickFn={() => void 0}/></Link>
                        </span>
                      </summary>
                      <pre><code>{task.getDetail()}</code></pre>
                    </details>
                  </div>
                  <hr/>
                </div>
            ) : (
              <p>There is no task waiting</p>
            )}
        </>
      )}
    </>
  )
}
