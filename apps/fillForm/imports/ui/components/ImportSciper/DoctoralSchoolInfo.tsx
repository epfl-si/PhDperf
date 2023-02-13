import React, {useEffect, useState} from "react"
import {DoctoralSchool, DoctoralSchools} from "/imports/api/doctoralSchools/schema";
import {useTracker} from "meteor/react-meteor-data";
import {Meteor} from "meteor/meteor";

export const DoctoralSchoolInfo = ({doctoralSchool}: {doctoralSchool: DoctoralSchool }) => {
  const currentDoctoralSchool = useTracker(
    () => DoctoralSchools.findOne({ acronym: doctoralSchool.acronym }),
    [doctoralSchool])

  const [isFetchingProgramSciperName, setIsFetchingProgramSciperName] = useState(false)

  useEffect(() => {
    setIsFetchingProgramSciperName(true)
    Meteor.apply(
      "refreshDoctoralSchoolsProgramNameFromSciper",
      [ doctoralSchool.acronym ],
      { wait: false, noRetry: false },
      () => setIsFetchingProgramSciperName(false)
    )
  }, [doctoralSchool]);

  return (<>
    {currentDoctoralSchool && (
      <p>Doctoral program: {currentDoctoralSchool.acronym}<br/>
        Program
        director: {currentDoctoralSchool.programDirectorName ? <>{currentDoctoralSchool.programDirectorName} ({currentDoctoralSchool.programDirectorSciper})</> : <>{currentDoctoralSchool.programDirectorSciper}</>}
        {isFetchingProgramSciperName ? <>&nbsp;<span className={"loader"}/></> : <></>}<br/>
        Credits needed for this program: {currentDoctoralSchool.creditsNeeded}<br/>
        Annual report documentation : <a href={currentDoctoralSchool.helpUrl}
                                         target={'_blank'}>{currentDoctoralSchool.helpUrl}</a>
      </p>
    )}
  </>)
}
