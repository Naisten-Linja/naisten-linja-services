import React from 'react';
import styled from 'styled-components';
import { Router } from '@reach/router';
import { ThemeProvider } from 'styled-components';

import { NotFound } from './NotFound';
import { FetchToken } from './FetchToken';
import { AuthContextWrapper } from './AuthContext';
import { NotificationsContextWrapper } from './NotificationsContext';
import { Navigation } from './Navigation';
import { SendLetter } from './SendLetter';
import { ReadLetter } from './ReadLetter';
import { Admin } from './Admin';
import { Volunteer } from './Volunteer';

import 'turretcss/turret/_color.css';
import './assets/turret.css';

// Theme placeholder in case there is a need for theme variables.
// For colors or orther turret-specific variables,
// we can make use of css variables instead
const theme = {};

const AppContainer = styled.div`
  padding-top: 2rem;
  padding-bottom: 5rem;
`;

export const App = () => {
  return (
    <>
      <AuthContextWrapper>
        <ThemeProvider theme={theme}>
          <NotificationsContextWrapper>
            <Navigation />
            <AppContainer className="container">
              <Router>
                <NotFound default />
                <Admin path="admin/*" />
                <Volunteer path="volunteer/*" />
                <SendLetter path="write" />
                <ReadLetter path="read" />
                <FetchToken path="login/:nonce" />
              </Router>
            </AppContainer>
          </NotificationsContextWrapper>
        </ThemeProvider>
      </AuthContextWrapper>
    </>
  );
};
