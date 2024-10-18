/**
 * Allow to prepare and sent a reminder for a task.
 * By default, we prefill the form with the same data as the
 * initial notification sent when the task was
 * created.
 * A task can change this by using reminderXXX fields from the task header,
 * that take the priority on the preceding rule.
 */

import React, {useState} from "react";
import {useParams} from "react-router-dom";
import {global_Error, Meteor} from "meteor/meteor";
import {useTracker} from "meteor/react-meteor-data";

import {useAccountContext} from "/imports/ui/contexts/Account";

import {Loader} from "@epfl/epfl-sti-react-library";
import toast from "react-hot-toast";
import {toastErrorClosable} from "/imports/ui/components/Toasters";

import { Editor } from "@tinymce/tinymce-react";
import Mustache from "mustache"

import {Task} from "/imports/model/tasks";
import {getUserPermittedTaskReminder} from "/imports/policy/reminders";
import {ParticipantsAsRow} from "/imports/ui/components/Participant/List";


export function TaskReminderForm() {
  const {_id} = useParams<{ _id: string }>()

  const account = useAccountContext()

  const taskLoading = useTracker(() => {
    const handle = Meteor.subscribe('taskReminder', [_id]);
    return !handle.ready();
  }, [_id]);

  const task = useTracker(() => getUserPermittedTaskReminder(account?.user, _id)?.fetch()[0])

  if (!account?.isLoggedIn) return <Loader message={'Loading your data...'}/>
  if (taskLoading) return <Loader message={'Fetching the task info...'}/>
  if (!task) return <div>There is currently no task with this ID, you may not have enough permission or it may have been completed.</div>
  if (!task.variables.uuid)  return <div>This task is part of an old workflow and reminders can not be used.</div>

  return <ReminderForm task={ task! }/>
}

const ReminderForm = ({ task }: { task: Task }) => {

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const subjectRendered = Mustache.render(
    task?.customHeaders?.reminderSubject ?? task?.customHeaders?.notifySubject ?? '',
    task?.variables
  )

  const messageRendered = Mustache.render(
    task?.customHeaders?.reminderMessage ?? task?.customHeaders?.notifyMessage ?? '',
    task?.variables
  )

  const [to, setTo] = useState(
    ( task?.customHeaders?.notifyTo ? task.variables[task?.customHeaders?.notifyTo] : undefined ) ?? ''
  );

  const [cc, setCc] = useState(
    task?.customHeaders?.notifyCc ?? ''
  );

  const [bcc, setBcc] = useState(
    task?.customHeaders?.notifyBcc ?? ''
  );

  const [subject, setSubject] = useState(subjectRendered);

  const [message, setMessage] = useState(messageRendered);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if ( window.confirm('Send this reminder?') ) {
      setIsSubmitting(true)
      Meteor.apply(
        "sendReminder",
        [
          task._id,
          { to, cc, bcc, subject, message }
        ],
        { wait: true, noRetry: true },
        (error: global_Error | Meteor.Error | undefined) => {
          if (error) {
            toastErrorClosable(task._id!, `${ error }`)
            setIsSubmitting(false )
          } else {
            toast.success(`Successfully created a reminder`)
            setIsSubmitted(true)
          }
        }
      )
    }
  }

  return <>
    <h1 className={ 'h2' }>Send a reminder</h1>

    { !isSubmitted && <>
      <div className={ 'mb-2' }>For the task:
        <div><strong>{ task?.customHeaders?.title }</strong></div>
      </div>
      <div>
        <ParticipantsAsRow
          task={ task }
          showEmail={ true }
          showStatusColor={ false }
        />
      </div>
      <hr/>
      <form className="new-reminder-form" onSubmit={ handleSubmit }>
        <div className="form-group">
          <label htmlFor="reminderFrom">From</label>
          <input
            id="reminderTo"
            className="form-control"
            type="text"
            value={ process.env.NOTIFIER_FROM_ADDRESS ?? 'Annual report <noreply@epfl.ch>' }
            disabled={ true }
          />
        </div>
        <div className="form-group">
          <label htmlFor="reminderTo" className={ "field-required" }>To</label>
          <input
            id="reminderTo"
            className="form-control"
            type="email"
            multiple={ true }
            value={ to }
            onChange={ (e) => setTo(e.target.value) }
            disabled={ isSubmitting }
            required={ true }
          />
        </div>
        <div className="form-group">
          <label htmlFor="reminderCc">Cc</label>
          <input
            id="reminderCc"
            className="form-control"
            type="email"
            multiple={ true }
            value={ cc }
            onChange={ (e) => setCc(e.target.value) }
            disabled={ isSubmitting }
          />
        </div>
        <div className="form-group">
          <label htmlFor="reminderBcc">Bcc</label>
          <input
            id="reminderBcc"
            className="form-control"
            type="email"
            multiple={ true }
            value={ bcc }
            onChange={ (e) => setBcc(e.target.value) }
            disabled={ isSubmitting }
          />
        </div>
        <div className="form-group">
          <label htmlFor="reminderSubject" className={ "field-required" }>Subject</label>
          <input
            id="reminderSubject"
            className="form-control"
            type="text"
            value={ subject }
            onChange={ (e) => setSubject(e.target.value) }
            disabled={ isSubmitting }
            required={ true }
          />
        </div>
        <div className="form-group">
          <label htmlFor="reminderMessage" className={ "field-required" }>Message</label>
          <Editor
            tinymceScriptSrc="/js/tinymce/tinymce.min.js"
            plugins={ 'link' }
            toolbar={ 'undo redo | styles | align | bold italic | link' }
            init={ {
              menubar: false,
              statusbar: true,
              promotion: false,
              branding: false,
              link_context_toolbar: true,
              height: 500,
              content_style: isSubmitting ? '.mce-content-readonly { background-color: #e6e6e6; }' : undefined
            } }
            initialValue={ messageRendered }
            value={ message }
            onEditorChange={ (e) => setMessage(e) }
            disabled={ isSubmitting }
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary mt-2 mb-2"
          disabled={ isSubmitting }
        >Send reminder
        </button>
      </form>
    </> }
    { isSubmitted && <>
      <div>Reminder sent.</div>
    </> }
  </>
}
