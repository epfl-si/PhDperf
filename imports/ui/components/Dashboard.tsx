import {useTracker} from "meteor/react-meteor-data"
import {Meteor} from "meteor/meteor"
import {Tasks} from "/imports/model/tasks";
import _ from "lodash"
import React from "react"
import {Loader} from "@epfl/epfl-sti-react-library";
import {ParticipantDetail} from "/imports/model/participants";
import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {useAccountContext} from "/imports/ui/components/Account";


/*
 * TODO: manage unknown steps, it can happens in the future if we had a step without extending phdAssessSteps
 * TODO: load directly from bpmn ?
 */

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
const StepNotDone = () => <div className="dashboard-step dashboard-step-not-done border col m-1 p-2 text-white"/>

const StepDone = () => <div className="dashboard-step dashboard-step-done border col m-1 p-2 bg-success text-white"/>

const StepPending = ({task}: {task: ITaskDashboard}) => {
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
    <div className="dashboard-step dashboard-step-pending border col m-1 p-2 bg-awaiting text-white"
     data-toggle="tooltip"
     title={ onHoverInfo } />
  )
}

const DrawProgress = ({tasks}: { tasks: ITaskDashboard[] }) => {

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
            return <StepNotDone key={ taskKey } />
          } else if (pendingTasksIds.includes(y.id)) {
            parallelPendingDone = true
            return <StepPending key={ taskKey } task={ task! } />
          } else {
            return <StepDone key={ taskKey } />
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
          return <StepPending key={ taskKey } task={ task! } />
        } else if (pendingDone) {
          return <StepNotDone key={ taskKey } />
        }
        else {
          return <StepDone key={ taskKey } />
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

export function Dashboard() {
  const account = useAccountContext()

  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe('tasksDashboard');
    return !handle.ready();
  }, []);

  const allTasks = useTracker(
    () => Tasks.find({}, { sort: { 'variables.created_at': 1 } })
      .fetch() as ITaskDashboard[])
      .filter((task) => task.elementId !== 'Activity_Program_Assistant_Assigns_Participants')
  const groupByWorkflowInstanceTasks = _.groupBy(allTasks, 'workflowInstanceKey')

  if (!account?.isLoggedIn) return (<Loader message={'Loading your data...'}/>)

  return (
    <>
      {listLoading ? (
        <Loader message={'Fetching tasks...'}/>
      ) : (
        allTasks.length === 0 ? (
          <div>There is currently no task</div>
          ) : (
          <div className="container small dashboard">
            <div className="row" key={ `dashboard_title_row` }>
              <div className="dashboard-header dashboard-header-phdStudentName col-2 m-1 p-2 text-black align-self-end">Name</div>
              <div className="dashboard-header dashboard-header-doctoralProgramName col m-1 p-2 text-black align-self-end">Program</div>
              {
                _.flatten(phdAssesSteps).map((step) => <div className="dashboard-header col m-1 p-2 text-black align-self-end" key={step.id}>{step.label}</div>)
              }
            </div>
            {
              Object.keys(groupByWorkflowInstanceTasks).map((taskGrouper: string) => {
                const workflowInstanceTasks = groupByWorkflowInstanceTasks[taskGrouper]
                return (
                  <div className="row" key={ `${workflowInstanceTasks[0]._id}_main_div` }>
                    <div className="dashboard-phdStudentName col-2 m-1 p-2 text-black" key={ `${workflowInstanceTasks[0]._id}_phdStudentScioer` } >{ workflowInstanceTasks[0].variables.phdStudentName ?? workflowInstanceTasks[0].variables.phdStudentSciper }</div>
                    <div className="dashboard-doctoralProgramName col m-1 p-2 text-black" key={ `${workflowInstanceTasks[0]._id}_doctoralProgramName` } >{ workflowInstanceTasks[0].variables.doctoralProgramName }</div>
                    <DrawProgress tasks={ workflowInstanceTasks }  key={ workflowInstanceTasks[0]._id } />
                  </div>
                )
              })
            }
          </div>)
      )}
    </>
  )
}
