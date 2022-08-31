import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

const RealDate = Date;

beforeEach(() => {
  global.Date.now = jest.fn(() => Date.parse('2019-04-22').valueOf());
});

afterEach(() => {
  global.Date = RealDate;
});

jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without the tests breaking
  useTranslation: () => {
    return {
      t: (str: unknown, params?: Record<string, unknown>) => {
        // If interpolation parameters are given, print those as a list after the key name
        if (params) return `${str}[${Object.values(params).join()}]`;
        // Otherwise just print the translation key instead of the translated string.
        return str;
      },
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
}));
