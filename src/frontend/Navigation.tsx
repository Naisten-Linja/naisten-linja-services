import React, { useRef } from 'react';
import styled from 'styled-components';
import { Link } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { ButtonSmall } from './ui-components/buttons';
import ResponsiveMenu from 'react-responsive-navbar';
import { IoMdMenu, IoMdClose } from 'react-icons/io';

export const Navigation = () => {
  const responsiveMenu= useRef<any>(null);

  const handleMenuItemClicked = () => {
    if (responsiveMenu.current) responsiveMenu.current?.handleClick();
  }

  return (
    <NavigationWrapper>
      <ResponsiveMenu
        ref={responsiveMenu}
        menuOpenButton={<IoMdMenu size={24} />}
        menuCloseButton={<IoMdClose size={24} color="MediumPurple" />}
        changeMenuOn="500px"
        largeMenuClassName="padding-m"
        smallMenuClassName="padding-m"
        menu={<MainMenu afterMenuClicked={handleMenuItemClicked}/>}
      />
    </NavigationWrapper>
  );
};

const MainMenu: React.FC<{ afterMenuClicked: () => void }> = ({ afterMenuClicked }) => {
  const { user, logout, login } = useAuth();
  return (
    <nav className="nav-inline" onClick={afterMenuClicked}>
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
            <ButtonSmall buttonType="secondary" onClick={logout} className="button button-xxs">
              Logout
            </ButtonSmall>
          </li>
        )}
      </ul>
    </nav>
  );
};

const NavigationWrapper = styled.div`
  width: 100%;
  position: sticky;
  z-index: 10;
  top: 0;
  background: #2e0556;
  color: var(--white);
`;
