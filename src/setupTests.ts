import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

const RealDate = Date;

beforeEach(() => {
  global.Date.now = jest.fn(() => Date.parse('2019-04-22').valueOf());
});

afterEach(() => {
  global.Date = RealDate;
});
