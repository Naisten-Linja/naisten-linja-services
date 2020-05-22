import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import axios from 'axios';

import type { LetterAdmin } from '../common/constants-common';
import { BACKEND_URL } from './constants-frontend';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

export const Letters = (props: RouteComponentProps) => {
  const [letters, setLetters] = useState<Array<LetterAdmin>>([]);
  const [users, setUsers] = useState<Array<LetterAdmin>>([]);
  const { token } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const result = await axios.get<{ data: Array<LetterAdmin> }>(`${BACKEND_URL}/letters`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setLetters(result.data.data);
      } catch (err) {
        console.log(err);
        setLetters([]);
        addNotification({ type: 'error', message: 'Unable to get letters', timestamp: Date.now() });
      }
    };
    fetchLetters();
  }, []);
  return (
    <>
      <h1>Letters</h1>
      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>Title</th>
            <th>Status</th>
            <th>Assigned to</th>
          </tr>
        </thead>
        <tbody>
          {letters.map((letter) => {
            return (
              <tr key={`letter-list-item-${letter.uuid}`}>
                <td>{new Date(letter.created).toLocaleDateString('fi-FI')}</td>
                <td>{letter.title}</td>
                <td>{letter.status}</td>
                <td>{letter.assignedResponderUuid}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};
