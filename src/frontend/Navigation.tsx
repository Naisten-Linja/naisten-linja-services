import React from 'react';
import styled from 'styled-components';

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
            <li>Naisten Linja Volunteers</li>
            {!user && (
              <li>
                <ButtonSmall type="secondary" onClick={login}>
                  login
                </ButtonSmall>
              </li>
            )}
            {user && (
              <li>
                {user.email} ({user.role}) {` `}
                <ButtonSmall type="secondary" onClick={logout} className="button button-xxs">
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

const NavigationWrapper = styled.div`
  width: 100%;
  position: fixed;
  padding: 0.5rem 0;
  z-index: 10;
  top: 0;
  left: 0;
  background: var(--info);
  color: var(--white);
`;
