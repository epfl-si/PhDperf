import React from "react";
import {useAccountContext} from "/imports/ui/contexts/Account";
import {ITaskList} from "/imports/policy/tasksList/type";
import {Badge} from "react-bootstrap";


export const TaskInfo = ({ task, showPhDStudent=true }: { task: ITaskList, showPhDStudent?: boolean }) => {
  const account = useAccountContext()

  return <>
      <span className={'mr-auto'}>
        { showPhDStudent &&
          <div className={'task-phdstudent-info mr-2'}>

            <span className={ 'task-phdstudent-name' }>
              { task.variables.phdStudentLastNameUsage } { task.variables.phdStudentFirstNameUsage }
            </span> {
              task.variables.phdStudentSciper && <>
              ( <span className={ 'task-phdstudent-sciper' }>
                  { task.variables.phdStudentSciper }
                </span> )
              </>
            }
          </div>
        }
        {task.created_at &&
          <span className={'mr-2 small'}>Created {task.created_at.toLocaleString('fr-CH')}</span>
        }
        {task.updated_at &&
          <span className={'small'}>Updated {task.updated_at.toLocaleString('fr-CH')}</span>
        }
        { account?.user?.isAdmin && task.isObsolete &&
          <Badge pill variant={'warning'} className={'small ml-2'}>
            Obsolete
          </Badge>
        }
      </span>
    </>
}
