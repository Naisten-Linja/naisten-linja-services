import React from 'react';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../i18n/i18n.constants';

export const NotFound: React.FC = () => {
  const { t } = useTranslation(namespaces.pages.statusCode);

  return <h1>{t('404')}</h1>;
};
