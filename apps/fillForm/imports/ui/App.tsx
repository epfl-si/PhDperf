import React from 'react';
import {router} from "/imports/ui/routes";
import {RouterProvider} from "react-router-dom";
import {AccountProvider} from "/imports/ui/contexts/Account";
import {ConnectionStatusProvider} from "/imports/ui/contexts/ConnectionStatus";


export const App = () => (
  <ConnectionStatusProvider>
    <AccountProvider>
      <RouterProvider router={router}/>
    </AccountProvider>
  </ConnectionStatusProvider>
)
