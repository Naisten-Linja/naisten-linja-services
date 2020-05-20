import React from 'react';
import { Router } from '@reach/router';

import { Home } from './Home';
import { Login } from './Login';
import { FetchToken } from './FetchToken';

export const App = () => {
  return (
    <Router>
      <Home path="/" />
      <Login path="login" />
      <FetchToken path="login/:nonce" />
    </Router>
  );
};
