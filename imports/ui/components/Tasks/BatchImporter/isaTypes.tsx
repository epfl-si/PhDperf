// Specify which data coming from the API will be used

interface Person {
  sciper: string
  fullName: string
  email: string
}

interface Thesis {
  mentor: Person
  directeur: Person
  coDirecteur?: Person
  dateAdmThese: string // "12.10.2020"
}

interface DoctoratInfo {
  doctorant: Person
  thesis: Thesis
  dateImmatriculation: string  //"01.09.2019"
  dateExamCandidature: string  //"03.08.2020"
}

interface isaResponse {
  doctorants: DoctoratInfo[]
}
