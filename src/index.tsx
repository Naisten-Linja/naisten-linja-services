import 'normalize.css';
import React from 'react';
import ReactDOM from 'react-dom';

console.log(`Frontend ${process.env.REACT_APP_APP_VERSION} started`);

ReactDOM.render(
  <React.StrictMode>
    <h1>Hello World!</h1>
  </React.StrictMode>,
  document.getElementById('root'),
);
