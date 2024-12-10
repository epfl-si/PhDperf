import {DoctorantInfo} from "/imports/api/importScipers/isaTypes";
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";
import React, {CSSProperties, Dispatch, SetStateAction, useState} from "react";
import {
  sortDoctorantInfo,
  sortedByOrderPossibilities,
  sortedByPossibilities
} from "/imports/ui/components/ImportSciper/List";
import {Meteor} from "meteor/meteor";
import {SortArrow} from "/imports/ui/components/SortingHeader";


// this is overcomplicated so we can sort special chars (thx stackoverflow 74679345)
const normalizeUTF8NameForSort = (name: string | undefined) =>
  name?.normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .toLocaleLowerCase() ?? '';

const sortByDoctoralCandidateFunction = ( doctorantInfo: DoctorantInfo ) =>
  normalizeUTF8NameForSort(doctorantInfo?.doctorant?.lastName)

const sortByThesisDirector = ( doctorantInfo: DoctorantInfo ) =>
  normalizeUTF8NameForSort(doctorantInfo?.thesis?.directeur?.lastName)

const sortByThesisCoDirector = ( doctorantInfo: DoctorantInfo ) =>
  normalizeUTF8NameForSort(doctorantInfo?.thesis?.coDirecteur?.lastName)

const sortByMentor = ( doctorantInfo: DoctorantInfo ) =>
  normalizeUTF8NameForSort(doctorantInfo?.thesis?.mentor?.lastName)

const sortByImmatDate = (doctorantInfo: DoctorantInfo) =>
  doctorantInfo?.dateImmatriculation?.split('.')[1] +
  doctorantInfo?.dateImmatriculation?.split('.')[0]

const sortByExamCandidature = (doctorantInfo: DoctorantInfo) =>
  doctorantInfo?.dateExamCandidature?.split('.')[1] +
  doctorantInfo?.dateExamCandidature?.split('.')[0]

const sortByThesisAdmDate = (doctorantInfo: DoctorantInfo) =>
  doctorantInfo?.thesis?.dateAdmThese?.split('.')[1] +
  doctorantInfo?.thesis?.dateAdmThese?.split('.')[1]

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
  const backgroundColor: CSSProperties = Meteor.settings.public.isTest && !Meteor.settings.public.ignoreTestBackgroundColor ? { backgroundColor: 'Cornsilk' } : { backgroundColor: 'white' }

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
    <div
      className="import-scipers-header row-header row small align-self-end pl-2 pb-1 sticky-top"
      style={ backgroundColor ?? {} }
    >
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
        <a className={ 'import-scipers-header-label'}
          onClick={ () => {
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
        }}
      >
          Doctoral candidate name&nbsp;
          <SortArrow
            direction={
              sortedBy === 'doctoralCandidate' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div className={ `col-2 ${ defaultColClasses }` }>
        <a className={ 'import-scipers-header-label'}
          onClick={ () => {
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
        }}
      >
          Thesis director&nbsp;
          <SortArrow
            direction={
              sortedBy === 'thesisDirector' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div className={ `col-2 ${ defaultColClasses }` }>
        <a className={ 'import-scipers-header-label'}
          onClick={ () => {
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
        }}
      >
          Thesis co-director&nbsp;
          <SortArrow
            direction={
              sortedBy === 'thesisCoDirector' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div className={ `col-2 ${ defaultColClasses }` }>
        <a className={ 'import-scipers-header-label'}
          onClick={ () => {
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
          }}
        >
          Mentor&nbsp;
          <SortArrow
            direction={
              sortedBy === 'mentor' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div className={ `col-1 ${ defaultColClasses }` }>
        <a className={ 'import-scipers-header-label'}
          onClick={ () => {
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
          }}
        >
          Immatricul. date&nbsp;
          <SortArrow
            direction={
              sortedBy === 'immatriculationDate' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div className={ `col-1 ${ defaultColClasses }` }>
        <a className={ 'import-scipers-header-label'}
          onClick={ () => {
            if (sortedBy === 'candidacyExamDate') {
              if (sortedByOrder === 'asc') {
                setSorting({
                  func: [sortByExamCandidature],
                  order: ['desc']
                });
                setSortedByOrder('desc')
              } else {
                setSorting({
                  func: [sortByExamCandidature],
                  order: ['asc']
                });
                setSortedByOrder('asc')
              }
            } else {
              setSorting({
                func: [sortByExamCandidature],
                order: ['asc']
              });
              setSortedByOrder('asc')
            }
            setSortedBy('candidacyExamDate')
          }}
        >
          Candidacy exam&nbsp;
          <SortArrow
            direction={
              sortedBy === 'candidacyExamDate' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
      <div className={ `col-1 ${ defaultColClasses }` }>
        <a className={ 'import-scipers-header-label'}
          onClick={ () => {
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
          }}
        >
          Thesis adm. date&nbsp;
          <SortArrow
            direction={
              sortedBy === 'thesisAdmDate' ? (
                sortedByOrder === 'asc' ?
                  'asc' : 'desc'
              ) : 'neutral'
            }
          />
        </a>
      </div>
    </div>
  )
}
