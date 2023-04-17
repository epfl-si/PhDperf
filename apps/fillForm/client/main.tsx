import { Meteor } from 'meteor/meteor'

import React from 'react';
import {createRoot} from "react-dom/client";

import Tequila from 'meteor/epfl:accounts-tequila'

import '/imports/policy'
import { App } from '/imports/ui/App'

const rootElement = document.getElementById("react-target");
const root = createRoot(rootElement!);

Meteor.startup(() => {
  Tequila.start()
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})
