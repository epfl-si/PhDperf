import React from "react";

import {NotificationLog} from "phd-assess-meta/types/notification";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faClockRotateLeft} from '@fortawesome/free-solid-svg-icons'
import {faEnvelope} from '@fortawesome/free-regular-svg-icons'


/**
 * List reminders sent
 *
 */
export const NotificationLogsListWithIcon = ({ logs }: { logs: NotificationLog[] }) => {
  return <>
    { logs
      .sort(
        (a,b) => {
          return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        })
      .map((log) => <>
        { log.sentAt && <div className={ 'notification-log-entry'}>
          <div>
            { log.type === 'reminder' || log.fromElementId.endsWith('_reminder') ?
              <FontAwesomeIcon icon={ faClockRotateLeft } className={ 'notification-log-entry-clock' } /> :
              <FontAwesomeIcon icon={ faEnvelope } className={ 'notification-log-entry-envelope' } />
            }
          </div>
          <div>
            { new Date(log.sentAt).toLocaleDateString('fr-CH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) }
          </div>
        </div> }
      </>
    )}
  </>
}
