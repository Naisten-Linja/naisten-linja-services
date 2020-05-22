import React from 'react';
import styled from 'styled-components';
import { Router } from '@reach/router';
import { ThemeProvider } from 'styled-components';

import { Container } from './ui-components/layout';
import { Home } from './Home';
import { Login } from './Login';
import { FetchToken } from './FetchToken';
import { AuthContextWrapper } from './AuthContext';
import { NotificationsContextWrapper } from './NotificationsContext';
import { Navigation } from './Navigation';
import { Users } from './Users';
import { SendLetter } from './SendLetter';
import { NotFound } from './NotFound';

import 'turretcss/turret/_color.css';
import './assets/turret.css';

// Theme placeholder case there is a need for theme variables.
// For colors or orther turret-specific variables,
// we can make use of css variables instead
const theme = {};

const AppContainer = styled(Container)`
  padding-top: 2rem;
`;

export const App = () => {
  return (
    <>
      <AuthContextWrapper>
        <ThemeProvider theme={theme}>
          <NotificationsContextWrapper>
            <Navigation />
            <AppContainer>
              <Router>
                <NotFound default />
                <SendLetter path="/" />
                <Login path="login" />
                <Users path="users" />
                <FetchToken path="login/:nonce" />
              </Router>
            </AppContainer>
          </NotificationsContextWrapper>
        </ThemeProvider>
      </AuthContextWrapper>
    </>
  );
};
