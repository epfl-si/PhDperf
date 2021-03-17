import { Mongo } from 'meteor/mongo';

export interface WorkflowTask {
  _id?: string;
  title: string;
  url: string;
  createdAt: Date;
}

export const WorkflowTasks = Meteor.isClient ?
  new Mongo.Collection<Link>('workflow-tasks') :
  undefined
