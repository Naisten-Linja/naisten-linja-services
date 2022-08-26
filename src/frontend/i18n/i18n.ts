import i18next, { i18n as i18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languages } from './i18n.constants';

import Backend from 'i18next-http-backend';

// import LanguageDetector from 'i18next-browser-languagedetector';

const createI18n = (language: string): i18nInstance => {
  const i18n = i18next.createInstance().use(initReactI18next);

  i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(Backend)
    .init({
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
      },
      lng: language,
      fallbackLng: language,
    });

  return i18n;
};

export const i18n = createI18n(languages.en);
