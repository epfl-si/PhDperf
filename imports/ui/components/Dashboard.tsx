import {useTracker} from "meteor/react-meteor-data"
import {Meteor} from "meteor/meteor"
import {Tasks} from "/imports/model/tasks";
import _ from "lodash"
import React, {CSSProperties, useState} from "react"
import Select from 'react-select'
import {Loader} from "@epfl/epfl-sti-react-library";
import {ParticipantDetail} from "/imports/model/participants";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {useAccountContext} from "/imports/ui/contexts/Account";


/*
 * TODO: manage unknown steps, it can happens in the future if we had a step without extending phdAssessSteps
 * TODO: load directly from bpmn ?
 */

type progressFormat = 'thin' | 'full'

/*
 * Define every step, like in the bpmn. If there are parallel steps, put them inside an array
 */
const phdAssesSteps = [
  {
    id: 'Activity_PHD_fills_annual_report',
    label: 'Phd fills annual report',
  },
  [
    {
      id: 'Activity_Thesis_Co_Director_fills_annual_report',
      label: 'Co-Dir fills annual report',
    },
    {
      id: 'Activity_Thesis_Director_fills_annual_report',
      label: 'Thesis Dir fills annual report',
    },
  ],
  {
    id: 'Activity_Thesis_Director_Collaborative_Review_Signs',
    label: 'Collaborative review',
  },
  {
    id: 'Activity_Thesis_Co_Director_Signs',
    label: 'Co-Dir signature',
  },
  {
    id: 'Activity_Thesis_Director_Signs',
    label: 'Thesis Dir signature',
  },
  {
    id: 'Activity_PHD_Signs',
    label: 'PhD signature',
  },
  [
    {
      id: 'Activity_Post_Mentor_Meeting_Mentor_Signs',
      label: 'Mentor signature',
    },
    {
      id: 'Activity_Post_Mentor_Meeting_PHD_Signs',
      label: 'PhD signature after mentor',
    },
  ],
  {
    id: 'Activity_Program_Director_Signs',
    label: 'Program Director signature',
  },
]

/*
 * only for admins && programAssistant (can see all?)
 *
 */
// here we can get multiple task, as they should be grouped by workflow instance id
// if they are multiple, that means we are waiting for two steps = 2 blue color
const StepNotDone = ({ format } : { format : progressFormat }) => <div className={
  format === 'thin' ?
    "dashboard-step-not-done border col m-1 p-2 text-white" :
    "dashboard-step dashboard-step-not-done border col m-1 p-2 text-white"
}/>

const StepDone = ({ format } : { format : progressFormat }) => <div className={
  format === 'thin' ?
    "dashboard-step-done border col m-1 p-2 bg-success text-white" :
    "dashboard-step dashboard-step-done border col m-1 p-2 bg-success text-white"
}/>

const StepPending = ({ task, format }: { task: ITaskDashboard, format : progressFormat }) => {
  let assignees: ParticipantDetail[] | undefined = task.assigneeScipers && Object.values(task.participants).filter((participant: ParticipantDetail) => task.assigneeScipers!.includes(participant.sciper))

  assignees = (assignees && assignees.length > 1) ? _.uniqWith(assignees, _.isEqual) : assignees  // make it uniqu if we have multiple roles
  let onHoverInfo = ``

  const currentStepLabel = _.flatten(phdAssesSteps).find((step) => step.id === task!.elementId)
  if (currentStepLabel) onHoverInfo += `Step: ${currentStepLabel?.label}\n`

  const assigneesLabel = assignees?.map((assignee: ParticipantDetail) => ` ${assignee.name} (${assignee.sciper})`).join(',') ?? ''
  if (assigneesLabel) onHoverInfo += `Assignee: ${assigneesLabel}\n`
  if (task!.updated_at) onHoverInfo += `Preceding step completion date: ${task.updated_at!.toLocaleString('fr-CH', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })}`

  return (
    <div className={
      format === 'thin' ?
        "dashboard-step-pending border col m-1 p-2 bg-awaiting text-white" :
        "dashboard-step dashboard-step-pending border col m-1 p-2 bg-awaiting text-white"
    }
     data-toggle="tooltip"
     title={ onHoverInfo } />
  )
}

const CurrentProgress = ({ tasks, format }: { tasks: ITaskDashboard[], format: progressFormat }) => {

  let pendingDone = false
  let parallelPendingDone = false
  let pendingTasksIds = tasks.map(task => task.elementId)

  const progressBarDrawn = (<>
    {
    phdAssesSteps.map((x, i) => {
      if (Array.isArray(x)) {
        // having an array means we can have multiple pending, or some pending, some finished. Let's discover it
        const multipleSteps = x.map((y, j) => {
          const task = tasks.find(t => t.elementId === y.id)
          const taskKey = `${task?._id}_${i}_${j}`
          if (pendingDone) {
            return <StepNotDone key={ taskKey } format={ format } />
          } else if (pendingTasksIds.includes(y.id)) {
            parallelPendingDone = true
            return <StepPending key={ taskKey } task={ task! } format={ format } />
          } else {
            return <StepDone key={ taskKey } format={ format } />
          }
        })

        if (parallelPendingDone) pendingDone = true
        return multipleSteps
      }
      else {
        const task = tasks.find(t => t.elementId === x.id)
        const taskKey = `${task?._id}_${i}`
        if (pendingTasksIds.includes(x.id)) {
          pendingDone = true
          return <StepPending key={ taskKey } task={ task! } format={ format } />
        } else if (pendingDone) {
          return <StepNotDone key={ taskKey } format={ format } />
        }
        else {
          return <StepDone key={ taskKey } format={ format } />
        }
      }
    })
  }</>)

  if (pendingDone) {
    return progressBarDrawn
  } else {
    const unknownSteps = tasks.map(t => t.elementId)
    return <div className={'col-6 p-2'}>Some steps are not identifiable : `${unknownSteps}`</div>
  }
}

const StepsAsHeader = () => {
  const backgroundColor: CSSProperties = Meteor.settings.public.isTest ? {backgroundColor: 'Cornsilk'} : {}
  return (
    <div
      className="dashboard-title row flex-nowrap"
      key={ `dashboard_title_row` }
      style={ backgroundColor ?? {} }
    >
      {
        _.flatten(phdAssesSteps).map((step) => <div className="dashboard-header col mx-1 mt-1 px-2 pt-2 text-black align-self-end" key={step.id}>{step.label}</div>)
      }
    </div>
)}

const Row = ({ workflowInstanceTasks } : { workflowInstanceTasks:ITaskDashboard[] }) => {
  const [showDetail, setShowDetail] = useState(false)

  const task = workflowInstanceTasks[0]  // from the stack of instances, the one should do the job

  return (<>
  <div className='dropdown-divider'></div>
    <div className="row" key={ `${task._id}_main_div` }>
      <div className="col-12">
        <div className='row'>
          <div className="dashboard-phdStudentName col m-1 p-2 text-black" key={ `${task._id}_phdStudentSciper` } >
            <a href={`https://people.epfl.ch/${task.variables.phdStudentSciper}`} target={'_blank'}>{ task.variables.phdStudentName }</a> ({ task.variables.phdStudentSciper })
          </div>
          <div className="dashboard-doctoralProgramName col m-1 p-2 text-black" key={ `${task._id}_doctoralProgramName` } >
            { task.variables.doctoralProgramName }
          </div>
          <div className="dashboard-updated_at col m-1 p-2 text-black" key={ `${task._id}_updated_at` } >
            { task.updated_at?.toLocaleString('fr-CH') }
          </div>
          <div className="dashboard-updated_at col-4 m-1 p-2 text-black" key={ `${task._id}_updated_at` } >
            { !showDetail &&
              <>
                <div className={'row'}>
                  <CurrentProgress tasks={workflowInstanceTasks} key={task._id} format={'thin'}/>
                  <a href={"#"} onClick={() => setShowDetail(true)}>Detail</a>
                </div>
              </>
            }
          </div>
        </div>
        { showDetail &&
          <>
            <div className={'row'}>
              <StepsAsHeader/>
            </div>
            <div className='row'>
              <CurrentProgress tasks={workflowInstanceTasks} key={task._id} format={'full'}/>
            </div>
            <div className={'row'}>
            <a href={"#"} onClick={() => setShowDetail(false)}>Hide detail</a>
            </div>
          </>
        }
      </div>
    </div>
  </>)
}

const ProgramSelector = () => {
  return (
    <>
      <div className={'h5'}>Doctoral programs</div>
      <Select
        placeholder={ 'Select doctoral programs...' }
        defaultValue={ 'all' }
        defaultMenuIsOpen={ false }
        isMulti={ false }
        options={ [
          // @ts-ignore
          { value: 'EDAM', label: 'EDAM'},
          // @ts-ignore
          { value: 'EDEY', label: 'EDEY'},
          // @ts-ignore
          { value: 'all', label: 'All'},
        ]
        }
        menuPlacement={'top'}
      />
    </>
  );
}

const FilterByParticipants = () => {
  return (
    <div className={'my-2 border-bottom border-top'}>
      <div className={'h5'}>Filter by participants</div>
      <div>
        <label>
          Name or sciper: &nbsp;
          <input type="text" name="name" />
        </label>
      </div>
      <div>
        <label>
          Role: &nbsp;
          <input type="text" name="name" />
        </label>
      </div>
    </div>
)}

const FilterBySteps = () => {
  return (
    <>
      <div className={'h5'}>Steps</div>
      <Select
        placeholder={ 'Select step...' }
        defaultValue={ 'all' }
        defaultMenuIsOpen={ false }
        isMulti={ false }
        menuPlacement={'top'}
        options={ [
          // @ts-ignore
          { value: 'Phd fills annual report', label: 'Phd fills annual report'},
          // @ts-ignore
          { value: 'PhD signature', label: 'PhD signature'},
          // @ts-ignore
          { value: 'all', label: 'All'},
        ]
        }
      />
    </>
  );
}

export function Dashboard() {
  const account = useAccountContext()

  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasksDashboard');
    return !handle.ready();
  }, []);

  let allTasks = useTracker(
    () => Tasks.find({})
      .fetch() as ITaskDashboard[])
      .filter((task) => task.elementId !== 'Activity_Program_Assistant_Assigns_Participants')

  // sort by second part of email address, that's the best way to get the name at this point
  allTasks = _.sortBy(
    allTasks,
    [
      function(task:ITaskDashboard) {
        const doctoralSchool = task.variables.doctoralProgramName
        if (task.variables?.phdStudentEmail) {
          return `${doctoralSchool}${_.split(task.variables?.phdStudentEmail, '.')[1]}`
        } else {
          return `${doctoralSchool}`
        }
    }]
  )

  const groupByWorkflowInstanceTasks = _.groupBy(allTasks, 'workflowInstanceKey')

  if (!account?.isLoggedIn) return (<Loader message={'Loading your data...'}/>)


  if (listLoading) return (<Loader message={'Fetching tasks...'}/>)

  if (allTasks.length === 0) return (<div>There is currently no task</div>)

  return (<>
    <div className='small mb-3'>
      <ProgramSelector/>
      <FilterByParticipants/>
      <FilterBySteps/>
    </div>
    <div className="container-fluid small dashboard">
      {
        Object.keys(groupByWorkflowInstanceTasks).map(
          (taskGrouper: string) =>
            <Row
              workflowInstanceTasks={ groupByWorkflowInstanceTasks[taskGrouper] }
              key={ groupByWorkflowInstanceTasks[taskGrouper][0]._id }
            />
       )
      }
    </div>
  </>)
}
