// load some default data if there is none
import { Meteor } from 'meteor/meteor'
import { DoctoralSchools } from '/imports/api/doctoralSchools/schema'
import debug_ from 'debug'

Meteor.startup(() => {
  if (DoctoralSchools.find().count() === 0) {
    debug_('Doctoral schools is empty, loading first stack of values..')
    const initialEcolesDoctorales = [
      {acronym: 'EDAM', label: 'Doctorat (Manufacturing (edoc))'},
      {acronym: 'EDAR', label: 'Doctorat (Architecture et sciences de la ville (edoc))'},
      {acronym: 'EDBB', label: 'Doctorat (Biotechnologie et génie biologique (edoc))'},
      {acronym: 'EDCB', label: 'Doctorat (Biologie computationnelle et quantitative (edoc))'},
      {acronym: 'EDCE', label: 'Doctorat (Génie civil et environnement (edoc))'},
      {acronym: 'EDCH', label: 'Doctorat (Chimie et génie chimique (edoc))'},
      {acronym: 'EDDH', label: 'Doctorat (Humanités digitales (edoc))'},
      {acronym: 'EDEE', label: 'Doctorat (Génie électrique (edoc))'},
      {acronym: 'EDEY', label: 'Doctorat (Energie (edoc))'},
      {acronym: 'EDFI', label: 'Doctorat (Finance (edoc))'},
      {acronym: 'EDIC', label: 'Doctorat (Informatique et communications (edoc))'},
      {acronym: 'EDMA', label: 'Doctorat (Mathématiques (edoc))'},
      {acronym: 'EDME', label: 'Doctorat (Mécanique (edoc))'},
      {acronym: 'EDMI', label: 'Doctorat (Microsystèmes et microélectronique (edoc))'},
      {acronym: 'EDMS', label: 'Doctorat (Approches moléculaires du vivant (edoc))'},
      {acronym: 'EDMT', label: 'Doctorat (Management de la technologie (edoc))'},
      {acronym: 'EDMX', label: 'Doctorat (Science et génie des matériaux (edoc))'},
      {acronym: 'EDNE', label: 'Doctorat (Neurosciences (edoc))'},
      {acronym: 'EDPO', label: 'Doctorat (Photonique (edoc))'},
      {acronym: 'EDPY', label: 'Doctorat (Physique (edoc))'},
      {acronym: 'EDRS', label: 'Doctorat (Robotique, contrôle et systèmes intelligents (edoc))'},
      {acronym: 'JDPLS', label: 'Doctorat (Learning Sciences (edoc))'}
    ]

    initialEcolesDoctorales.forEach((doctoralSchool) => {
      DoctoralSchools.insert(doctoralSchool);
    });
  }
});
