import React, { useRef } from 'react';
import styled from 'styled-components';
import { Link } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { ButtonSmall } from './ui-components/buttons';
import ResponsiveMenu from 'react-responsive-navbar';
import { IoMdMenu, IoMdClose } from 'react-icons/io';

export const Navigation = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responsiveMenu = useRef<any>(null);

  const handleMenuItemClicked = () => {
    if (responsiveMenu.current) responsiveMenu.current?.handleClick();
  };

  return (
    <NavigationWrapper>
      <ResponsiveMenu
        ref={responsiveMenu}
        menuOpenButton={<IoMdMenu size={24} />}
        menuCloseButton={<IoMdClose size={24} />}
        changeMenuOn="600px"
        largeMenuClassName="padding-m container"
        smallMenuClassName="padding-m"
        menu={<MainMenu afterMenuClicked={handleMenuItemClicked} />}
      />
    </NavigationWrapper>
  );
};

const MainMenu: React.FC<{ afterMenuClicked: () => void }> = ({ afterMenuClicked }) => {
  const { user, logout, login } = useAuth();
  return (
    <StyledNav onClick={afterMenuClicked}>
      <ul>
        <li>
          <Link to="/" style={{ fontWeight: 'bold' }}>
            Naisten Linja
          </Link>
        </li>
        {user && user.role === UserRole.staff && (
          <>
            <li>
              <Link to="admin/letters">Letters</Link>
            </li>
            <li>
              <Link to="admin/users">Users</Link>
            </li>
            <li>
              <Link to="admin/booking-types">Booking Types</Link>
            </li>
            <li>
              <Link to="admin/booking">Booking calendar</Link>
            </li>
            <li>
              <Link to="admin/all-bookings">All bookings</Link>
            </li>
            <li>
              <Link to="admin/my-bookings">My bookings</Link>
            </li>
            <li>
              <Link to="admin/settings">Settings</Link>
            </li>
            <li>
              <Link to="admin/materials">Materials</Link>
            </li>
          </>
        )}
        {user && user.role === UserRole.volunteer && (
          <>
            <li>
              <Link to="volunteer/letters">Your assigned letters</Link>
            </li>
            <li>
              <Link to="volunteer/booking">Booking calendar</Link>
            </li>
            <li>
              <Link to="volunteer/my-bookings">My bookings</Link>
            </li>
            <li>
              <Link to="volunteer/materials">Materials</Link>
            </li>
          </>
        )}
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
            <a
              href="/api/auth/profile-redirect"
              target="_blank"
              className="button button-secondary button-xxs"
            >
              Edit profile
            </a>
            <ButtonSmall buttonType="secondary" onClick={logout} className="button button-xxs">
              Logout
            </ButtonSmall>
          </li>
        )}
      </ul>
    </StyledNav>
  );
};

const NavigationWrapper = styled.div`
  width: 100%;
  position: sticky;
  z-index: 100;
  top: 0;
  background: #2e0556;
  color: var(--white);
`;

const StyledNav = styled.nav`
  ul {
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    list-style: none;
  }
  li {
    flex: none;
    margin: 0;
    padding-right: 1rem;
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }
  a {
    text-decoration: underline;
  }
  @media (max-width: 500px) {
    padding: 10px 0;

    ul {
      display: inline-block;
    }

    li {
      text-align: center;
      padding: 10px 0;
      display: block;
      margin-left: 0;
    }
  }
`;
