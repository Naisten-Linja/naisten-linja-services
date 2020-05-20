import React from 'react';
import { RouteComponentProps } from '@reach/router';

import { BACKEND_URL } from './constants-frontend';

export const Home = (props: RouteComponentProps) => {
  return <a href={`${BACKEND_URL}/auth/sso`}>login</a>;
};
