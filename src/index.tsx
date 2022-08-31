import 'normalize.css';
import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './frontend/App';

// Import translation
import './frontend/i18n/i18n';

console.log(`Frontend ${process.env.REACT_APP_APP_VERSION} started`);

ReactDOM.render(
  <React.StrictMode>
    <React.Suspense fallback={<>Loading...</>}>
      <App />
    </React.Suspense>
  </React.StrictMode>,
  document.getElementById('root'),
);
