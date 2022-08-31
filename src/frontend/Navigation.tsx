import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Link } from '@reach/router';
import Select from 'react-select';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from './i18n/i18n.constants';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { ButtonSmall } from './ui-components/buttons';
import ResponsiveMenu from 'react-responsive-navbar';
import { IoMdMenu, IoMdClose } from 'react-icons/io';

import { languages } from './i18n/i18n.constants';
import { SelectWrapper } from './shared/utils-frontend';

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

type OptionType = {
  value: string;
  label: string;
};

const languageOptions: OptionType[] = Object.values(languages).map(
  // yep thats correct
  (value) => ({ value, label: value }),
);

const findSupportedLanguage = (browserLanguage: string): string => {
  if (browserLanguage.startsWith('fi')) {
    return 'fi';
  } else {
    return 'en';
  }
};

const MainMenu: React.FC<{ afterMenuClicked: () => void }> = ({ afterMenuClicked }) => {
  const { t, i18n } = useTranslation(namespaces.navigation);

  const browserLanguage = i18n.language || window.navigator.language;
  const [language, setLanguage] = useState(findSupportedLanguage(browserLanguage));

  const handleLanguageChanged = (selected: OptionType) => {
    setLanguage(selected.value);
    i18n.changeLanguage(selected.value);
  };

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
              <Link to="admin/letters">{t('letters')}</Link>
            </li>
            <li>
              <Link to="admin/users">{t('users')}</Link>
            </li>
            <li>
              <Link to="admin/booking-types">{t('booking-types')}</Link>
            </li>
            <li>
              <Link to="admin/booking">{t('booking-calendar')}</Link>
            </li>
            <li>
              <Link to="admin/all-bookings">{t('all-bookings')}</Link>
            </li>
            <li>
              <Link to="admin/my-bookings">{t('my-bookings')}</Link>
            </li>
            <li>
              <Link to="admin/settings">{t('settings')}</Link>
            </li>
            <li>
              <Link to="admin/materials">{t('materials')}</Link>
            </li>
          </>
        )}
        {user && user.role === UserRole.volunteer && (
          <>
            <li>
              <Link to="volunteer/letters">{t('your-assigned-letters')}</Link>
            </li>
            <li>
              <Link to="volunteer/booking">{t('booking-calendar')}</Link>
            </li>
            <li>
              <Link to="volunteer/my-bookings">{t('my-bookings')}</Link>
            </li>
            <li>
              <Link to="volunteer/materials">{t('materials')}</Link>
            </li>
          </>
        )}
        <li>
          <ul>
            <li>
              <SelectWrapper>
                <Select
                  className="color-black"
                  value={languageOptions.find((option) => option.value === language)}
                  options={languageOptions}
                  isClearable={false}
                  onChange={(selected) => {
                    if (selected !== null) {
                      handleLanguageChanged(selected);
                    }
                  }}
                />
              </SelectWrapper>
            </li>
            {!user && (
              <li>
                <ButtonSmall buttonType="secondary" onClick={login}>
                  {t('login')}
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
                  {t('edit-profile')}
                </a>
                <ButtonSmall buttonType="secondary" onClick={logout} className="button button-xxs">
                  {t('logout')}
                </ButtonSmall>
              </li>
            )}
          </ul>
        </li>
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
