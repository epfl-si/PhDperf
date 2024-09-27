import React, {useState} from "react";

import {Link} from "react-router-dom";
import {
  useFloating,
  useInteractions,
  useClick,
  autoUpdate,
  offset,
} from "@floating-ui/react";

import {ITaskDashboard} from "/imports/policy/dashboard/type";
import {NotificationLog} from "phd-assess-meta/types/notification";
import {Step} from "phd-assess-meta/types/dashboards";

const NotificationLogsSentToDetail = (
  { sentTo }: { sentTo: {
      to: string[]
      cc: string[]
      bcc: string[]
    } }
) => {
  return <>
    { sentTo.to &&
      <div>
        <span>To: </span>
        <span>{ sentTo.to.join(', ') }</span>
      </div>
    }
    { sentTo.cc && sentTo.cc.length > 0 &&
      <div>
        <span>Cc: </span>
        <span>{ sentTo.cc.join(', ') }</span>
      </div>
    }
    { sentTo.bcc && sentTo.bcc.length > 0 &&
      <div>
        <span>Bcc: </span>
        <span>{ sentTo.bcc.join(', ') }</span>
      </div>
    }
  </>
}

const NotificationDetail = ({ log }: { log: NotificationLog }) => {
  return <div className={ 'm-2' }>
    { log.sentAt && <>
      <div>{ log.isUnconfirmed && 'Estimated' } Date: { new Date(log.sentAt).toLocaleString('fr-CH') }</div>
      { log.sentTo && <NotificationLogsSentToDetail sentTo={ log.sentTo }/> }
      { log.fromElementId.endsWith('_reminder') && <div>Type: reminder</div> }
    </> }
  </div>
}

export const NotificationsInfoToggle = ({ workflowInstanceTasks }: { workflowInstanceTasks: ITaskDashboard[] }) => {

  const [isOpen, setIsOpen] = useState(false)
  const notificationLogs = workflowInstanceTasks[0].notificationLogs.filter(
                                                      (log: NotificationLog ) => log.sentAt
                                                    ) as NotificationLog[] ?? []

  if (notificationLogs.length == 0) return <></>

  return <div className={ "row dashboard-reminders" }>
    <div className={ 'col-1' }></div>
    <div className={ 'col' }>
      { isOpen ?
        <>
          { notificationLogs
              .map( (log: NotificationLog) => (
            <NotificationDetail key={ log.sentAt } log={ log }/>
          ))
          }
          <a
            href={''}
            onClick={ (e) => {
              setIsOpen( !isOpen );
              e.preventDefault();
            }}
          >Close</a>
        </> :
        <>
          <a
            href={''}
            onClick={ (e) => {
              setIsOpen( !isOpen );
              e.preventDefault();
            }}
          >{ notificationLogs.length ?? 0 } notification(s) sent</a>
        </>
      }
    </div>
  </div>
}


/**
 * Mainly used into the steps, to follow how many notifications has been send in the corresponding step
 */
export const NotificationsCount = (
  { step, task, children }: {
    step: Step, task: ITaskDashboard, children?: React.ReactNode
  }) => {

  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    middleware: [offset(3)],
    placement: "bottom-start",
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);

  const {getReferenceProps, getFloatingProps} = useInteractions([
    click,
  ]);

  const notificationLogsForThisStep = task.notificationLogs.filter(
    // count the normal and the reminders
    (log: NotificationLog) =>
      (log.fromElementId === step.id || log.fromElementId === step.id + '_reminder')
  ) ?? []

  return <div className={ 'pl-4 small' }>
    <span className={ 'mr-1 align-middle' }>
      { notificationLogsForThisStep.length }
    </span>
    <span className={ 'text-white align-middle' } ref={ refs.setReference } { ...getReferenceProps() }>
      <svg className="icon" aria-hidden="true">
        <use xlinkHref="#mail"></use>
      </svg>
    </span>
    { notificationLogsForThisStep.length > 0 && isOpen && (
      <div
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          border: 'solid 1px',
          background: "white",
          color: "black",
          padding: 5,
          zIndex: '5',
        }}
        {...getFloatingProps()}
      >
        <div className={'m2'}>
          <b>{ notificationLogsForThisStep[0]?.fromElementId ?? '' }</b>
        </div>
        { notificationLogsForThisStep
            .map<React.ReactNode>( (log: NotificationLog, i) => (
              <>
                { i > 0 && <div className={ 'border-top' }></div> }
                <NotificationDetail
                  key={ log.sentAt }
                      log={ log }
                    />
              </>
            ))
        }
      </div>
    )}
    { children }
  </div>
}

export const NotificationsCountWithAddNewButton = ({ step, task }: { step: Step, task: ITaskDashboard }) => {
  return <NotificationsCount step={ step } task={ task }>
    &nbsp;<Link to={ `/tasks/${ task._id }/reminders/create` } className={ 'text-white' }>
      <svg className="icon" aria-hidden="true">
        <use xlinkHref="#plus-circle"></use>
      </svg>
    </Link>
  </NotificationsCount>
}
