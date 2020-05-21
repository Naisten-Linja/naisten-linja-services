import React, { useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import axios from 'axios';

import { BACKEND_URL } from './constants-frontend';
import { Button } from './ui-components/buttons';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import type { LetterAccessInfo } from '../common/constants-common';

export const SendLetter = (props: RouteComponentProps) => {
  const { token } = useAuth();
  const [letterAccessInfo, setLetterAccessInfo] = useState<LetterAccessInfo | null>(null);
  const { addNotification } = useNotifications();

  const createLetter = async () => {
    try {
      const result = await axios.post(`${BACKEND_URL}/online-letter/start`);
      setLetterAccessInfo(result.data.data);
    } catch (err) {
      addNotification({ type: 'error', message: 'Unable to start a letter, please try again.', timestamp: Date.now() });
    }
  };
  return (
    <>
      <h1>Send us a letter</h1>
      {!letterAccessInfo && <Button onClick={createLetter}>Start a letter</Button>}
      {JSON.stringify(letterAccessInfo)}
    </>
  );
};
