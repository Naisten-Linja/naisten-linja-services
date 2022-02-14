import React from 'react';
import { Router } from '@reach/router';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import moment from 'moment-timezone';

import { NotFound } from './NotFound';
import { FetchToken } from './FetchToken';
import { AuthContextWrapper } from './AuthContext';
import { NotificationsContextWrapper } from './NotificationsContext';
import { Navigation } from './Navigation';
import { FrontPage } from './pages/FrontPage';
import { Admin } from './Admin';
import { Volunteer } from './Volunteer';

import 'turretcss/turret/_color.css';
import './assets/turret.css';

// Set default timezone
moment.tz.setDefault('Europe/Helsinki');

// Theme placeholder in case there is a need for theme variables.
// For colors or orther turret-specific variables,
// we can make use of css variables instead
const theme = {};

const GlobalStyle = createGlobalStyle`
  .button {
    margin-right: 1rem;
  }
`;

const AppContainer = styled.div`
  padding-top: 2rem;
  padding-bottom: 5rem;
`;

export const App = () => {
  return (
    <>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <AuthContextWrapper>
          <NotificationsContextWrapper>
            <Navigation />
            <AppContainer className="container">
              <Router>
                <NotFound default />
                <Admin path="admin/*" />
                <Volunteer path="volunteer/*" />
                <FrontPage path="/" />
                <FetchToken path="login/:nonce" />
              </Router>
            </AppContainer>
          </NotificationsContextWrapper>
        </AuthContextWrapper>
      </ThemeProvider>
    </>
  );
};
