import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import moment from 'moment-timezone';

import { NotFound } from './pages/NotFound';
import { SSOLoginCallbackHandler } from './SSOLoginCallbackHandler';
import { AuthContextWrapper } from './AuthContext';
import { NotificationsContextWrapper } from './NotificationsContext';
import { Navigation } from './Navigation';
import { FrontPage } from './pages/FrontPage';
import { AdminRouter } from './AdminRouter';
import { VolunteerRouter } from './VolunteerRouter';

import 'turretcss/turret/_color.css';
import './assets/turret.css';

// Set default timezone
// THIS IS VERY IMPORTANT TO KEEP THE WHOLE APPLICATION WORKING AS EXPECTED IN THE SAME TIMEZONE.
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
    <BrowserRouter>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <AuthContextWrapper>
          <NotificationsContextWrapper>
            <Navigation />
            <AppContainer className="container">
              <Routes>
                <Route path="admin/*" element={<AdminRouter />} />
                <Route path="volunteer/*" element={<VolunteerRouter />} />
                <Route path="/" element={<FrontPage />} />
                <Route path="login/:nonce" element={<SSOLoginCallbackHandler />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppContainer>
          </NotificationsContextWrapper>
        </AuthContextWrapper>
      </ThemeProvider>
    </BrowserRouter>
  );
};
