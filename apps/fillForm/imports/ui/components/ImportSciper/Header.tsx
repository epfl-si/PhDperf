import {DoctorantInfo} from "/imports/api/importScipers/isaTypes";
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import React, {Dispatch, SetStateAction, useState} from "react";
import {
  sortDoctorantInfo,
  sortedByOrderPossibilities,
  sortedByPossibilities
} from "/imports/ui/components/ImportSciper/List";
import {Meteor} from "meteor/meteor";


const sortByDoctoralCandidateFunction = ( doctorantInfo: DoctorantInfo ) => doctorantInfo?.doctorant?.lastName
const sortByThesisDirector = ( doctorantInfo: DoctorantInfo ) => doctorantInfo?.thesis?.directeur?.lastName
const sortByThesisCoDirector = ( doctorantInfo: DoctorantInfo ) => doctorantInfo?.thesis?.coDirecteur?.lastName
const sortByMentor = ( doctorantInfo: DoctorantInfo ) => doctorantInfo?.thesis?.mentor?.lastName
const sortByImmatDate = (doctorantInfo: DoctorantInfo) => doctorantInfo?.dateImmatriculation?.split('.')[1]
const sortByExamCandiature = (doctorantInfo: DoctorantInfo) => doctorantInfo?.dateExamCandidature?.split('.')[1]
const sortByThesisAdmDate = (doctorantInfo: DoctorantInfo) => doctorantInfo?.thesis?.dateAdmThese?.split('.')[1]


export const HeaderRow = (
  {doctoralSchool, isAllSelected, disabled, setSorting} : {
    doctoralSchool: DoctoralSchool,
    isAllSelected: boolean,
    disabled: boolean
    setSorting: Dispatch<SetStateAction<sortDoctorantInfo>>
  }
) => {
  const [isToggling, setIsToggling] = useState(false)

  // keep a trace of the current sort
  const [ sortedBy, setSortedBy ] = useState<sortedByPossibilities>('candidacyExamDate')
  const [ sortedByOrder, setSortedByOrder ] = useState<sortedByOrderPossibilities>('asc')

  const defaultColClasses = "align-self-end"

  const setAllCheck = (state: boolean) => {
    setIsToggling(true)

    Meteor.call('toggleAllDoctorantCheck', doctoralSchool.acronym, state, (error: any) => {
        if (!error) {
          setIsToggling(false)
        }
      }
    )
  }

  return (
    <div className="row-header row small font-weight-bold align-self-end pl-2 pb-1">
      <div className={ `col-1 ${defaultColClasses}` }>
        <input
          type="checkbox"
          id="select-all"
          name="select-all"
          checked={ isAllSelected }
          disabled={ isToggling || disabled }
          onChange={ () => { setAllCheck(!isAllSelected); } }
        />
        { isToggling &&
          <span className="loader" />
        }
      </div>
      <div className={ `col-2 align-self-end` }>
        <a onClick={ () => {
          if (sortedBy === 'doctoralCandidate') {
            if (sortedByOrder === 'asc') {
              setSorting({
                func: [sortByDoctoralCandidateFunction],
                order: ['desc']
              });
              setSortedByOrder('desc')
            } else {
              setSorting({
                func: [sortByDoctoralCandidateFunction],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
          } else {
            setSorting({
              func: [sortByDoctoralCandidateFunction],
              order: ['asc']
            });
            setSortedByOrder('asc')
          }
          setSortedBy('doctoralCandidate')
        } }>
          Doctoral candidate name&nbsp;
          { sortedBy === 'doctoralCandidate' ?
            <span className={ 'header-sortable-icon' }>
                { sortedByOrder === 'asc' && <>▼</> }
              { sortedByOrder === 'desc' && <>▲</> }
              </span> :
            <span className={ 'header-sortable-icon' }>▬</span>
          }
        </a>
      </div>
      <div className={ `col-2 ${ defaultColClasses }` }>
        <a onClick={ () => {
          if (sortedBy === 'thesisDirector') {
            if (sortedByOrder === 'asc') {
              setSorting({
                func: [sortByThesisDirector],
                order: ['desc']
              });
              setSortedByOrder('desc')
            } else {
              setSorting({
                func: [sortByThesisDirector],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
          } else {
            setSorting({
              func: [sortByThesisDirector],
              order: ['asc']
            });
            setSortedByOrder('asc')
          }
          setSortedBy('thesisDirector')
        } }>
          Thesis director&nbsp;
          { sortedBy === 'thesisDirector' ?
            <span className={ 'header-sortable-icon' }>
                { sortedByOrder === 'asc' && <>▼</> }
              { sortedByOrder === 'desc' && <>▲</> }
              </span> :
            <span className={ 'header-sortable-icon' }>▬</span>
          }
        </a>
      </div>
      <div className={ `col-2 ${ defaultColClasses }` }>
        <a onClick={ () => {
          if (sortedBy === 'thesisCoDirector') {
            if (sortedByOrder === 'asc') {
              setSorting({
                func: [sortByThesisCoDirector],
                order: ['desc']
              });
              setSortedByOrder('desc')
            } else {
              setSorting({
                func: [sortByThesisCoDirector],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
          } else {
            setSorting({
              func: [sortByThesisCoDirector],
              order: ['asc']
            });
            setSortedByOrder('asc')
          }
          setSortedBy('thesisCoDirector')
        } }>
          Thesis co-director&nbsp;
          { sortedBy === 'thesisCoDirector' ?
            <span className={ 'header-sortable-icon' }>
                { sortedByOrder === 'asc' && <>▼</> }
              { sortedByOrder === 'desc' && <>▲</> }
              </span> :
            <span className={ 'header-sortable-icon' }>▬</span>
          }
        </a>
      </div>
      <div className={ `col-2 ${ defaultColClasses }` }>
        <a onClick={ () => {
          if (sortedBy === 'mentor') {
            if (sortedByOrder === 'asc') {
              setSorting({
                func: [sortByMentor],
                order: ['desc']
              });
              setSortedByOrder('desc')
            } else {
              setSorting({
                func: [sortByMentor],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
          } else {
            setSorting({
              func: [sortByMentor],
              order: ['asc']
            });
            setSortedByOrder('asc')
          }
          setSortedBy('mentor')
        } }>
          Mentor&nbsp;
          { sortedBy === 'mentor' ?
            <span className={ 'header-sortable-icon' }>
                { sortedByOrder === 'asc' && <>▼</> }
              { sortedByOrder === 'desc' && <>▲</> }
              </span> :
            <span className={ 'header-sortable-icon' }>▬</span>
          }
        </a>
      </div>
      <div className={ `col-1 ${ defaultColClasses }` }>
        <a onClick={ () => {
          if (sortedBy === 'immatriculationDate') {
            if (sortedByOrder === 'asc') {
              setSorting({
                func: [sortByImmatDate],
                order: ['desc']
              });
              setSortedByOrder('desc')
            } else {
              setSorting({
                func: [sortByImmatDate],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
          } else {
            setSorting({
              func: [sortByImmatDate],
              order: ['asc']
            });
            setSortedByOrder('asc')
          }
          setSortedBy('immatriculationDate')
        } }>
          Immatricul. date&nbsp;
          { sortedBy === 'immatriculationDate' ?
            <span className={ 'header-sortable-icon' }>
                { sortedByOrder === 'asc' && <>▼</> }
              { sortedByOrder === 'desc' && <>▲</> }
              </span> :
            <span className={ 'header-sortable-icon' }>▬</span>
          }
        </a>
      </div>
      <div className={ `col-1 ${ defaultColClasses }` }>
        <a onClick={ () => {
          if (sortedBy === 'candidacyExamDate') {
            if (sortedByOrder === 'asc') {
              setSorting({
                func: [sortByExamCandiature],
                order: ['desc']
              });
              setSortedByOrder('desc')
            } else {
              setSorting({
                func: [sortByExamCandiature],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
          } else {
            setSorting({
              func: [sortByExamCandiature],
              order: ['asc']
            });
            setSortedByOrder('asc')
          }
          setSortedBy('candidacyExamDate')
        } }>
          Candidacy exam&nbsp;
          { sortedBy === 'candidacyExamDate' ?
            <span className={ 'header-sortable-icon' }>
                { sortedByOrder === 'asc' && <>▼</> }
              { sortedByOrder === 'desc' && <>▲</> }
              </span> :
            <span className={ 'header-sortable-icon' }>▬</span>
          }
        </a>
      </div>
      <div className={ `col-1 ${ defaultColClasses }` }>
        <a onClick={ () => {
          if (sortedBy === 'thesisAdmDate') {
            if (sortedByOrder === 'asc') {
              setSorting({
                func: [sortByThesisAdmDate],
                order: ['desc']
              });
              setSortedByOrder('desc')
            } else {
              setSorting({
                func: [sortByThesisAdmDate],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
          } else {
            setSorting({
              func: [sortByThesisAdmDate],
              order: ['asc']
            });
            setSortedByOrder('asc')
          }
          setSortedBy('thesisAdmDate')
        } }>
          Thesis adm. date&nbsp;
          { sortedBy === 'thesisAdmDate' ?
            <span className={ 'header-sortable-icon' }>
                { sortedByOrder === 'asc' && <>▼</> }
              { sortedByOrder === 'desc' && <>▲</> }
              </span> :
            <span className={ 'header-sortable-icon' }>▬</span>
          }
        </a>
      </div>
    </div>
  )
}
