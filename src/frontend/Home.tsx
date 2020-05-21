import React from 'react';
import { RouteComponentProps, Link } from '@reach/router';

export const Home = (props: RouteComponentProps) => {
  return <Link to="/send">Send letter</Link>;
};
