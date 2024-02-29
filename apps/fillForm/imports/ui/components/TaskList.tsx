import {global_Error, Meteor} from "meteor/meteor"
import React, {useRef, useState} from "react"
import _ from "lodash"
import {useTracker} from 'meteor/react-meteor-data'
import {Tasks} from "/imports/model/tasks";
import {WorkflowStarter} from './workflowStarter'
import {Button, Loader} from "@epfl/epfl-sti-react-library"
import {Link, useNavigate} from "react-router-dom"
import {ParticipantsAsRow} from "/imports/ui/components/Participant/Show";
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
import {Button as BSButton, Form, Modal} from "react-bootstrap";
import {ModalProps} from "react-bootstrap/Modal";


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
            Object.keys(groupByTasks).map((tasksGrouper: string) => (
              <div
                className={'tasksGrouper'}
                key={ tasksGrouper }
              >
                <h3 className={'mt-5'}>{tasksGrouper}</h3>
                {
                  groupByTasks[tasksGrouper].map((task) =>
                    <TaskRow
                      key={ task._id }
                      user={ account.user! }
                      task={ task }
                    />
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

  const [isModalRefreshOpen, setModalRefreshOpen] = useState(false);
  const [isModalCancelOpen, setModalCancelOpen] = useState(false);

  const canDelete = user && canDeleteProcessInstance(user)
  const canRefresh = user && canRefreshProcessInstance(user)
  const canEditParticipants = user && canEditParticipantsCheck(user)

  return (
    <div
      data-id={ task._id }
      data-process-instance={ task.processInstanceKey }
      className={'task border-top p-2'}
      style={ {
        ...((user && user.isAdmin && task.isObsolete) && {backgroundColor: 'WhiteSmoke'})
      } }
    >
      <RefreshProcessInstanceModal
        task={ task }
        onHide={ () => setModalRefreshOpen(false) }
        show={ isModalRefreshOpen }
      />
      <CancelProcessInstanceModal
        task={ task }
        onHide={ () => setModalCancelOpen(false) }
        show={ isModalCancelOpen }
      />
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
                      paddingLeft: '0.2em',
                      paddingRight: '0.2em',
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
                        onSelect={ () => setModalRefreshOpen(true) }
                      >Refresh
                      </Dropdown.Item>
                    }
                    { canDelete &&
                      <Dropdown.Item
                        className={'small'}
                        onSelect={ () => setModalCancelOpen(true) }
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
            <ParticipantsAsRow task={ task } showEmail={ false }/>
          </div>
        }
      </details>
    </div>
  )
}

interface ModalPropsWithTask extends ModalProps {
  task: ITaskList
}

const RefreshProcessInstanceModal = (
  props: ModalPropsWithTask
) => {

  const handleRefresh = (e: any) => {
    e.preventDefault()
    Meteor.apply(
      "refreshProcessInstance", [props.task.processInstanceKey], { wait: true, noRetry: true },
      (error: global_Error | Meteor.Error | undefined) => {
        if (error) {
          props.onHide && props.onHide();
          toastErrorClosable(props.task.processInstanceKey, `${error}`)
        } else {
          props.onHide && props.onHide();
          toast.success(`Successfully refreshed the process instance. You may wait some time while the new task(s) is being created`)
        }
      }
    );
  }

  const inputReference = useRef<HTMLInputElement>(null)

  return <Modal
    { ...props }
    backdrop={ "static" }
    animation={ true }
    centered
    onEntered={ () => inputReference?.current?.focus() } // trick to make the enter key works
  >
      <Modal.Header closeButton={ false }>
        <Modal.Title>Refresh a process instance</Modal.Title>
      </Modal.Header>

    <Modal.Body>
      <Form onSubmit={ handleRefresh }>
        {/*this hidden form is here to steal the focus and make the "enter" keypress event do something*/}
        <div style={ { height:0, width: 0, overflow: 'hidden' } }>
          <Form.Control type="text" ref={ inputReference } />
        </div>
        <div>Remove the process instance so it is refreshed after max 2 minutes ?</div>
        <div>{ props.task.variables.phdStudentName } ({ props.task.variables.phdStudentSciper })</div>
        <code>{ props.task.detail }</code>
      </Form>
    </Modal.Body>

    <Modal.Footer>
      <BSButton
        type='button'
        className="btn btn-secondary mr-2"
        onClick={ props.onHide }
      >
        Close
      </BSButton>
      <BSButton
        type='button'
        className="btn btn-primary"
        onClick={ handleRefresh }
      >
        Refresh
      </BSButton>
    </Modal.Footer>
  </Modal>
}

const CancelProcessInstanceModal = (
  props: ModalPropsWithTask
) => {
  const handleDelete = (e: any) => {
    e.preventDefault()
    Meteor.apply(
      "deleteProcessInstance", [props.task.processInstanceKey], { wait: true, noRetry: true },
      (error: global_Error | Meteor.Error | undefined) => {
        if (error) {
          props.onHide && props.onHide();
          toastErrorClosable(props.task.processInstanceKey, `${ error }`)
        } else {
          props.onHide && props.onHide();
          toast.success(`Successfully removed the process instance`)
        }
      }
    )
  }

  const inputReference = useRef<HTMLInputElement>(null)

  return <Modal
    { ...props }
    backdrop={ "static" }
    animation={ true }
    centered
    onEntered={ () => inputReference?.current?.focus() } // trick to make the enter key works
  >
    <Modal.Header closeButton={ false }>
      <Modal.Title>Delete a process instance</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <Form onSubmit={ handleDelete }>
        {/*this hidden form is here to steal the focus and make the "enter" keypress event do something*/}
        <div style={ { height:0, width: 0, overflow: 'hidden' } }>
          <Form.Control type="text" ref={ inputReference } />
        </div>
        <div>
          Delete the process instance { props.task.processInstanceKey } {
          props.task.variables.phdStudentName && <>for { props.task.variables.phdStudentName }</>
        } ?
        </div>
        <div>{ props.task.variables.phdStudentName } ({ props.task.variables.phdStudentSciper })</div>
        <code>{ props.task.detail }</code>
      </Form>
    </Modal.Body>

    <Modal.Footer>
      <BSButton
        type='button'
        className="btn btn-secondary mr-2"
        onClick={ props.onHide }
      >
        Close
      </BSButton>
      <BSButton
        type='button'
        className="btn btn-primary"
        onClick={ handleDelete }
      >
        Delete
      </BSButton>

    </Modal.Footer>
  </Modal>
}
