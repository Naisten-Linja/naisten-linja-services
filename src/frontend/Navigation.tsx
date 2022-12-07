import React, { useCallback, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import Select from 'react-select';
import moment from 'moment-timezone';
import 'moment/locale/fi';
import 'moment/locale/en-gb';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from './i18n/i18n.constants';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { ButtonSmall } from './ui-components/buttons';
import { IoMdMenu, IoMdClose } from 'react-icons/io';

import { languages } from './i18n/i18n.constants';
import { SelectWrapper } from './shared/utils-frontend';

export const Navigation = () => {
  return (
    <NavigationWrapper>
      <MainMenu />
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

const MainMenu: React.FC = () => {
  const { t, i18n } = useTranslation(namespaces.navigation);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const browserLanguage = i18n.language || window.navigator.language;
  const [language, setLanguage] = useState(findSupportedLanguage(browserLanguage));

  const handleLanguageChanged = useCallback(
    (selected: OptionType) => {
      setLanguage(selected.value);
      const momentLocale = selected.value === 'fi' ? 'fi' : 'en-gb';
      moment.locale(momentLocale);
      i18n.changeLanguage(selected.value);
    },
    [i18n, setLanguage],
  );

  useEffect(() => {
    // Close menu when route changes
    setIsOpen(false);
  }, [location]);

  const { user, logout, login } = useAuth();
  const toggleMenu = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  return (
    <StyledNav>
      <MenuButton aria-label={isOpen ? 'Close menu' : 'Open menu'} onClick={toggleMenu}>
        {isOpen ? <IoMdClose size={24} aria-hidden /> : <IoMdMenu size={24} aria-hidden />}
      </MenuButton>
      <ul className={isOpen ? 'is-open' : 'is-closed'}>
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
  display: flex;
  justify-content: center;
  background: #2e0556;
  color: var(--white);
  padding: 1.5rem 0;

  @media screen and (max-width: 600px) {
    padding: 0;
  }
`;

const MenuButton = styled.button`
  background: transparent;
  border: none;
  color: #fff;
  padding: 0;
  display: none;
  margin: 0.25rem 0;
  width: 100%;

  &:hover,
  &:focus,
  &:active {
    background: transparent;
    border: none;
    color: #fff;
  }
  svg {
    width: 24px;
    height: 24px;
  }

  @media screen and (max-width: 600px) {
    display: block;
  }
`;

const StyledNav = styled.nav`
  display: flex;
  padding: 0 1.5rem;
  justify-content: center;
  flex-direction: column;
  max-width: 80rem;
  width: 100%;

  ul {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    list-style: none;
    width: 100%;
  }

  @media (max-width: 600px) {
    ul.is-closed {
      display: none !important;
    }
  }

  li {
    flex: none;
    margin: 0;
    padding-right: 1rem;

    @media (max-width: 600px) {
      width: 100%;
      text-align: center;
      padding: 0.5rem 0;
    }
  }

  a {
    text-decoration: underline;
  }
`;
