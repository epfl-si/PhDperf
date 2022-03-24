import { Mongo } from 'meteor/mongo'

type IdempotenceObservable = {
  // The ID of the Task instance this journal entry applies to
  _id: string
  // The number of times we received an ActivateJobsResponse from
  // Zeebe, that referenced this Task
  seenCount: number
  // The last time at which that happened
  lastSeen: Date
}

export const TaskObservables = new Mongo.Collection<IdempotenceObservable>('tasks_journal')
