import i18next, { i18n as i18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languages, namespaces } from './i18n.constants';

import Backend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';

const createI18n = (language: string): i18nInstance => {
  const i18n = i18next.createInstance().use(initReactI18next);

  i18n
    .use(Backend)
    // .use(LanguageDetector)
    .init(
      {
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        lng: language,
        fallbackLng: language,
        // debug: true,
        // interpolation: {
        //   escapeValue: false, // not needed for react as it escapes by default
        // },
        ns: [namespaces.navigation, ...Object.values(namespaces.pages)],
      },
      (err, t) => console.error('Something went wrong...', err, t('key')),
    );

  return i18n;
};

// TODO: change this to 'fi' when the translation is ready
export const i18n = createI18n(languages.en);
