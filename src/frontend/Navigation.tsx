import React from 'react';
import styled from 'styled-components';
import { Link } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { ButtonSmall } from './ui-components/buttons';
import { Container } from './ui-components/layout';

export const Navigation = () => {
  const { user, logout, login } = useAuth();
  return (
    <NavigationWrapper>
      <Container>
        <div className="group group-m group-space-between">
          <ul>
            <li>
              <MainMenu />
            </li>
            {!user && (
              <li>
                <ButtonSmall buttonType="secondary" onClick={login}>
                  login
                </ButtonSmall>
              </li>
            )}
            {user && (
              <li>
                {user.email} ({user.role}) {` `}
                <ButtonSmall buttonType="secondary" onClick={logout} className="button button-xxs">
                  Logout
                </ButtonSmall>
              </li>
            )}
          </ul>
        </div>
      </Container>
    </NavigationWrapper>
  );
};

const MainMenu = () => {
  const { user } = useAuth();
  return (
    <nav className="nav-inline">
      <ul>
        <li>
          <Link to="/">Naisten Linja</Link>
        </li>
        {user && user.role === UserRole.staff && (
          <>
            <li>
              <Link to="admin/letters">Letters</Link>
            </li>
            <li>
              <Link to="admin/users">Users</Link>
            </li>
          </>
        )}
        {user && user.role === UserRole.volunteer && (
          <>
            <li>
              <Link to="volunteer/letters">Your assigned letters</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

const NavigationWrapper = styled.div`
  width: 100%;
  position: -webkit-sticky; /* Safari */
  position: sticky;
  padding: 0.5rem 0;
  z-index: 10;
  top: 0;
  background: #2e0556;
  color: var(--white);
`;
