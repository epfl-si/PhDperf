import React from 'react';
import { Meteor } from 'meteor/meteor'
import { render } from 'react-dom'
import { App } from '/imports/ui/App'
import Tequila from 'meteor/epfl:accounts-tequila'
import '/imports/policy'

Meteor.startup(() => {
  Tequila.start()
  render(<App />, document.getElementById('react-target'))
})
