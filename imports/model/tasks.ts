import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import {Sciper} from "/imports/api/datatypes";
import {ParticipantList, participantsFromZeebe} from './participants';
import _ from 'lodash';
import {
  PhDCustomHeaderShape,
  PhDInputVariables,
  TaskInterface,
  TaskJournal
} from "/imports/model/tasksTypes";
import dayjs from "dayjs";


export class Task implements TaskInterface {
  declare _id?: string
  declare variables: PhDInputVariables
  declare processInstanceKey: string
  declare processDefinitionVersion: number
  declare activityLogs?: string
  declare key: string;
  declare type: string;
  declare workflowInstanceKey: string;
  declare bpmnProcessId: string;
  declare workflowDefinitionVersion: number;
  declare workflowKey: string;
  declare processKey: string;
  declare elementId: string;
  declare elementInstanceKey: string;
  declare customHeaders: Readonly<PhDCustomHeaderShape>;
  declare worker: string;
  declare retries: number;
  declare deadline: string;
  declare journal: TaskJournal;

  assigneeScipers?: Sciper[]
  participants?: ParticipantList
  created_by?: Sciper
  created_at?: Date
  updated_at?: Date
  detail: any

  constructor(doc: any) {
    _.extend(this, doc);

    // historically, assignees can come from multiple ways: as string or as array, from variables.assigneeSciper
    // Transform all into an array, named assigneeScipers
    if (this.variables?.assigneeSciper) {
      if (Array.isArray(this.variables.assigneeSciper)) {
        this.assigneeScipers = this.variables.assigneeSciper
      } else {
        this.assigneeScipers = [this.variables.assigneeSciper]
      }
    }

    if (this.variables) this.participants = participantsFromZeebe(this.variables)
    this.created_by = this.variables?.created_by
    this.created_at = this.variables.created_at ? new Date(this.variables?.created_at) : undefined
    this.updated_at = this.variables.updated_at ? new Date(this.variables?.updated_at) : undefined

    this.detail = [
      `Job key: ${this._id}`,
      `Process instance key: ${this.processInstanceKey}`,
      `workflow version: ${this.processDefinitionVersion}`,
    ].join(", ")
  }

  get monitorUri(): string | undefined {
    return Meteor.settings.public.monitor_address && Meteor.user()?.isAdmin ?
      `http://${Meteor.settings.public.monitor_address}/views/instances/${this.processInstanceKey}` :
      undefined
  }

  /*
   * as admins can have the lastSeen info, check here if the task is obsolete, or return undefined if the value can't be seen
   */
  get isObsolete(): boolean | undefined {
    if (this.journal?.lastSeen) {
      const yesterday = dayjs().subtract(1, 'day')
      const lastSeen = dayjs(this.journal.lastSeen)

      if (lastSeen <= yesterday) {
        return true
      } else {
        return false
      }
    }
  }
}

class TasksCollection extends Mongo.Collection<Task> {
  /**
   * Once a task is finished, instead of removing it completely,
   * journalize the submit operation, then remove the others fields (to free spaces, like a remove would do),
   * and keep it as it is, so we can set check status from incoming zeebe jobs
   */
    markAsSubmitted(_id: string) {
    const task = this.findOne( {_id: _id} );

    if (!task) return

    const betterKeepFields = [
      "_id",
      "journal"]

    const fieldsToUnsets =
      Object.keys(task).filter(el => !betterKeepFields.includes(el)).map(v => [v, ""])
    const unsetList = Object.fromEntries(fieldsToUnsets)

    this.update({_id: _id }, {
      $unset: unsetList,
      $set: { 'journal.submittedAt': new Date() }
    })
  }
}

export const Tasks = new TasksCollection('tasks',
  {
    transform: (doc: Task) => new Task(doc),
  }
)
