// load some default data if there is none
import { Meteor } from 'meteor/meteor'
import { DoctoralSchools } from '/imports/api/doctoralSchools/schema'
import debug_ from 'debug'

Meteor.startup(() => {
  if (DoctoralSchools.find().count() === 0) {
    debug_('Doctoral schools is empty, loading first stack of values..')
    const initialEcolesDoctorales = [
      {acronym: 'EDAM', label: 'Doctorat (Manufacturing (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDAR', label: 'Doctorat (Architecture et sciences de la ville (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDBB', label: 'Doctorat (Biotechnologie et génie biologique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDCB', label: 'Doctorat (Biologie computationnelle et quantitative (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDCE', label: 'Doctorat (Génie civil et environnement (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDCH', label: 'Doctorat (Chimie et génie chimique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDDH', label: 'Doctorat (Humanités digitales (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDEE', label: 'Doctorat (Génie électrique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDEY', label: 'Doctorat (Energie (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDFI', label: 'Doctorat (Finance (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDIC', label: 'Doctorat (Informatique et communications (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDMA', label: 'Doctorat (Mathématiques (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDME', label: 'Doctorat (Mécanique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDMI', label: 'Doctorat (Microsystèmes et microélectronique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDMS', label: 'Doctorat (Approches moléculaires du vivant (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDMT', label: 'Doctorat (Management de la technologie (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDMX', label: 'Doctorat (Science et génie des matériaux (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDNE', label: 'Doctorat (Neurosciences (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDPO', label: 'Doctorat (Photonique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDPY', label: 'Doctorat (Physique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'EDRS', label: 'Doctorat (Robotique, contrôle et systèmes intelligents (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'},
      {acronym: 'JDPLS', label: 'Doctorat (Learning Sciences (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': '12', 'programDirectorSciper': '168891'}
    ]

    initialEcolesDoctorales.forEach((doctoralSchool) => {
      DoctoralSchools.insert(doctoralSchool);
    });
  }
});
