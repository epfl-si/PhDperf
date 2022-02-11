import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import {Sciper} from "/imports/api/datatypes";
import {ParticipantList, participantsFromZeebe} from './participants';
import ephemeralDB from "/imports/db/ephemeral";
import _ from 'lodash';
import {PhDCustomHeaderShape, PhDInputVariables, TaskI} from "/imports/model/tasksTypes";


export class Task implements TaskI {
  declare _id?: string
  declare variables: PhDInputVariables
  declare processInstanceKey: string
  declare processDefinitionVersion: number
  declare assigneeSciper?: Sciper
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

  participants: ParticipantList
  created_by?: Sciper
  created_at?: Date
  updated_at?: Date
  detail: any

  constructor(doc: any) {
    _.extend(this, doc);
    this.participants = participantsFromZeebe(this.variables)
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
}

class TasksCollection extends Mongo.Collection<Task> {
  insert(doc: Task, callback?: Function) {
    if (Meteor.isServer) {
      return super.insert(doc, callback)
    } else {
      return super.insert(doc as Task, callback)
    }
  }
}

export const Tasks = new TasksCollection('tasks',
  {
    // @ts-ignore
    _driver : ephemeralDB,
    transform: (doc: Task) => new Task(doc),
  }
)
