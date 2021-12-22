import React from "react"
import {DoctoralSchool} from "/imports/api/doctoralSchools/schema";

export const DoctoralSchoolInfo = ({doctoralSchool}: {doctoralSchool: DoctoralSchool }) => {
  return (
    <p>Doctoral program: { doctoralSchool.acronym }<br/>
      Program director: { doctoralSchool.programDirectorSciper }<br/>
      Credits needed for this program: { doctoralSchool.creditsNeeded}<br/>
      Annual report documentation : <a href={ doctoralSchool.helpUrl } target={'_blank'}>{ doctoralSchool.helpUrl}</a>
    </p>
  )
}
