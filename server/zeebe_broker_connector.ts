import {Mongo} from 'meteor/mongo'
import {Meteor} from 'meteor/meteor'
import {ZeebeSpreadingClient} from "/imports/api/zeebeStatus"
import {decrypt} from "/server/encryption"
import {
  TasksCollection
} from '/imports/api/tasks'
import debug_ from 'debug'
import {Sciper} from "/imports/api/datatypes";
import {
  Duration,
  Job,
  ICustomHeaders,
  IInputVariables,
  IOutputVariables,
  JobCompletionInterface
} from "zeebe-node"
import {TaskData, TaskParticipant} from "/imports/ui/model/tasks";
import _ from "lodash";

const debug = debug_('phdAssess:server:workflow')

// This are the bpmn variables we could find for every steps and
// we will need through the code.
// Why a class instead an interface here ? To be able to read the
// keys later in the process. See https://stackoverflow.com/a/59806829
export class PhDInputVariables implements IInputVariables {
  created_by?: Sciper
  created_at?: string  // JSON date
  updated_at?: string  // JSON date
  assigneeSciper?: Sciper
  programAssistantSciper?: Sciper
  phdStudentSciper?: Sciper
  thesisDirectorSciper?: Sciper
  thesisCoDirectorSciper?: Sciper
  programDirectorSciper?: Sciper
  mentorSciper?: Sciper
  activityLogs?: string
  [key: string]: any  // the others var
}

export class PhDFormCustomHeaderShape implements ICustomHeaders {
  groups?: string[]  // manage permission groupwise
  title?: string  // title shown for this task
  formIO?: string  // the formIO JSON
  [key: string]: any  // the others var
}

// what is send as result
// should be the whole form, or an ACL decided value
interface OutputVariables {
  [key: string]: any
}

// redeclare what is a job in the PhD context
export interface PhDZeebeJob<WorkerInputVariables = PhDInputVariables, CustomHeaderShape = PhDFormCustomHeaderShape, WorkerOutputVariables = IOutputVariables> extends Job<WorkerInputVariables, CustomHeaderShape>, JobCompletionInterface<WorkerOutputVariables> {
}

const tasks = TasksCollection<TaskData>()
let zBClient: ZeebeSpreadingClient | null = null

function zeebeJobToTask(job: PhDZeebeJob): TaskData {

  // decrypt the variables before saving into memory (keep the typed values too)
  // Typescript hack with the "any" : make it writable by bypassing typescript. Well know it's bad,
  // but still, better than rebuilding the whole Zeebe interfaces to get it writeable
  const decryptedVariables: PhDInputVariables = {}

  Object.keys(job.variables).map(
    (key) => {
      try {
        decryptedVariables[key] = decrypt(job.variables[key])
      } catch (e) {
        if (e instanceof SyntaxError) {
          debug(`Can't decrypt ${key}`)
          throw e
        } else {
          throw e
        }
      }
    })

  let newTask: TaskData = {
    _id: job.key,
    created_by: decryptedVariables.created_by!,
    created_at: decryptedVariables.created_at ? new Date(decryptedVariables.created_at) : undefined,
    updated_at: decryptedVariables.updated_at ? new Date(decryptedVariables.updated_at) : undefined,
    title: job.customHeaders.title!,
    participants: [],
    formIO: job.customHeaders.formIO!,
    zeebeInfo: _.omit(job, ['variables', 'customHeaders']),
    variables: _.omit(decryptedVariables,
      'created_by',
      'created_at',
      'updated_at',
      'updated_at',
      'title',
      'activityLogs',
    )
  }

  // set activitylogs
  newTask.activityLogs = decryptedVariables.activityLogs ? JSON.parse(decryptedVariables.activityLogs) : []

  // Fullfill participant
  Object.keys(decryptedVariables).filter(key => key.endsWith('Sciper')).map((key) => {
    if (key === 'assigneeSciper') {  // assigne is an info, not a participant
      return
    }

    newTask.participants!.push({
      sciper: decryptedVariables[key],
      displayName: undefined,  // will do later, as it may be an crashing async API fetch and we want to keep going
      role: key.replace(/Sciper$/, ""),
      isAssignee: decryptedVariables.assigneeSciper && decryptedVariables.assigneeSciper == decryptedVariables[key]
    } as TaskParticipant)
  })

  /*
  // proto on how to do it with a class and some keys

  import {MyInputVariables, TaskData, TasksCollection, WorkerInputVariables} from "/imports/api/perf-workflow-tasks"
  const keysOfProps = Object.keys(new MyInputVariables()) as WorkerInputVariables;
  keysOfProps.forEach((key: string | number) => {
    if (key in data.variables) {
      task.participants.push(data.variables[key])
    }
  })
  */

  return newTask
}

export default {
  start() {
    const taskType = 'phdAssessFillForm'

    zBClient = new ZeebeSpreadingClient({
      pollInterval: Duration.seconds.of(5)
    })

    debug(`creating Zeebe worker of type "${taskType}"...`);
    zBClient.createWorker({
      taskType: taskType,
      maxJobsToActivate: 500,
      // Set timeout, the same as we will ask yourself if the job is still up
      timeout: Duration.milliseconds.of(1),
      // load every job into the in-memory server db
      taskHandler:
      // therefore, Fiber'd
        Meteor.bindEnvironment(
          (job: PhDZeebeJob,
          ) => {
            let task_id: string | undefined;

            if (!tasks.findOne({ _id: job.key } )) {  // Let's add this unknown task
              let newTask = zeebeJobToTask(job)
              task_id = tasks.insert(newTask)
              debug(`Received a new job from Zeebe ${ JSON.stringify(job.key) }`)
            } else {
              task_id = job.key
            }

            // To keep insync with Zeebe, log the last time we see this one
            tasks.update({ _id: task_id },{ $set: { lastSeen: new Date() }});

            return job.forward()  // tell Zeebe that result may come later, and free ourself for an another work
          })
    })
    debug(`Zeebe worker "${taskType}" created`);
  },
  find(query: any): Mongo.Cursor<TaskData> {
    return tasks.find(query)
  },
  async success(key: string, workerResult: OutputVariables) {
    debug(`Sending success to worker ${key} with result ${JSON.stringify(workerResult)}`)

    if (zBClient == null) {
      throw new Meteor.Error("zeebe disconnected",
        `The task ${key} can not be closed if zeebe is not connected.`);
    }

    await zBClient?.completeJob({
      jobKey: key,
      variables: workerResult,
    })
    debug(`Worker ${key} successfully closed  with the success state`)


    debug(`Worker ${key} successfully removed from server memory`)
  }
}
