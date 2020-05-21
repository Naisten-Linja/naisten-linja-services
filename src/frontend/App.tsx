import React from 'react';
import { Router } from '@reach/router';
import { ThemeProvider } from 'styled-components';

import { Container } from './ui-components/layout';
import { Home } from './Home';
import { Login } from './Login';
import { FetchToken } from './FetchToken';
import { AuthContextWrapper } from './AuthContext';
import { NotificationsContextWrapper } from './NotificationsContext';
import { Navigation } from './Navigation';

import 'turretcss/turret/_color.css';
import './assets/turret.css';

// Theme placeholder case there is a need for theme variables.
// For colors or orther turret-specific variables,
// we can make use of css variables instead
const theme = {};

export const App = () => {
  return (
    <>
      <ThemeProvider theme={theme}>
        <NotificationsContextWrapper>
          <AuthContextWrapper>
            <Container>
              <Navigation />
              <Router>
                <Home path="/" />
                <Login path="login" />
                <FetchToken path="login/:nonce" />
              </Router>
            </Container>
          </AuthContextWrapper>
        </NotificationsContextWrapper>
      </ThemeProvider>
    </>
  );
};
