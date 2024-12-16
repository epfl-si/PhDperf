// load some default data if there is none
import { Meteor } from 'meteor/meteor'
import { DoctoralSchools } from '/imports/api/doctoralSchools/schema'
import debug_ from 'debug'

export const initialEcolesDoctorales = [
  {acronym: 'EDAM', label: 'Doctorat (Manufacturing (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDAM'},
  {acronym: 'EDAR', label: 'Doctorat (Architecture et sciences de la ville (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDAR'},
  {acronym: 'EDBB', label: 'Doctorat (Biotechnologie et génie biologique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDBB'},
  {acronym: 'EDCB', label: 'Doctorat (Biologie computationnelle et quantitative (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDCB'},
  {acronym: 'EDCE', label: 'Doctorat (Génie civil et environnement (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDCE'},
  {acronym: 'EDCH', label: 'Doctorat (Chimie et génie chimique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDCH'},
  {acronym: 'EDDH', label: 'Doctorat (Humanités digitales (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDDH'},
  {acronym: 'EDEE', label: 'Doctorat (Génie électrique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDEE'},
  {acronym: 'EDEY', label: 'Doctorat (Energie (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDEY'},
  {acronym: 'EDFI', label: 'Doctorat (Finance (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDFI'},
  {acronym: 'EDIC', label: 'Doctorat (Informatique et communications (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDIC'},
  {acronym: 'EDMA', label: 'Doctorat (Mathématiques (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDMA'},
  {acronym: 'EDME', label: 'Doctorat (Mécanique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDME'},
  {acronym: 'EDMI', label: 'Doctorat (Microsystèmes et microélectronique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDMI'},
  {acronym: 'EDMS', label: 'Doctorat (Approches moléculaires du vivant (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDMS'},
  {acronym: 'EDMT', label: 'Doctorat (Management de la technologie (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDMT'},
  {acronym: 'EDMX', label: 'Doctorat (Science et génie des matériaux (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDMX'},
  {acronym: 'EDNE', label: 'Doctorat (Neurosciences (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDNE'},
  {acronym: 'EDPO', label: 'Doctorat (Photonique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDPO'},
  {acronym: 'EDPY', label: 'Doctorat (Physique (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDPY'},
  {acronym: 'EDRS', label: 'Doctorat (Robotique, contrôle et systèmes intelligents (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-EDRS'},
  {acronym: 'JDPLS', label: 'Doctorat (Learning Sciences (edoc))', 'helpUrl': 'https://www.epfl.ch', 'creditsNeeded': 12, 'programDirectorSciper': '168891', 'administrativeAssistantAccessGroup': 'phd-assess-ops-JDPLS'},
]

Meteor.startup(() => {
  if (DoctoralSchools.find().count() === 0) {
    debug_('Doctoral schools is empty. Loading first stack of values..')

    initialEcolesDoctorales.forEach((doctoralSchool) => {
      DoctoralSchools.insert(doctoralSchool);
    });
  }
});
