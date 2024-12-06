// Specify which data coming from the API will be used

export interface Person {
  sciper: string
  fullName: string
  email: string
  firstName: string
  lastName: string
}

export interface Thesis {
  mentor: Person
  directeur: Person
  coDirecteur?: Person
  dateAdmThese: string // "12.10.2020"
}

export interface DoctorantInfo {
  doctorant: Person
  thesis: Thesis
  dateImmatriculation: string  //"01.09.2019"
  dateExamCandidature: string  //"03.08.2020"
}

export interface isaResponse {
  doctorants: DoctorantInfo[]
}
