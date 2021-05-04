import {Meteor} from "meteor/meteor"
import React from "react"
import {useTracker} from 'meteor/react-meteor-data'
import {PerfWorkflowTask, PerfWorkflowTasks} from '/imports/ui/model/perf-workflow-tasks'
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
      <h3>Need input forms</h3>
      {listLoading ? (
        <Loader message={'Fetching tasks from Zeebe...'}/>
      ) : (
        <>
          <ul>
            {tasks.length > 0 ? tasks.map(
              (task: PerfWorkflowTask) =>
                <li key={task.key}>
                  {task.getName()}
                  <ul>
                    <li><a href={task.getOperateUri()} target="_blank">See on Operate</a></li>
                    <li><a onClick={() => console.log(task.getDetail())} href={'#'}>Console.log instance Details</a></li>
                  </ul>
                  <div><Link to={`tasks/${task.key}`}><Button label={'Proceed'} onClickFn={() => void 0}/></Link></div>
                  <hr className={"bold"}/>
                </li>
            ) : (
              <p>There is no task waiting</p>
            )}
          </ul>
          <Button label={'Initialize a new PhD Assessment process'}
                  onClickFn={() => Meteor.call("launch_workflow")}/>
        </>
      )}
    </>
  )
}

