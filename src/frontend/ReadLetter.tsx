import React, { useRef, useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import axios from 'axios';
import styled from 'styled-components';

import type { ApiLetterContent } from '../common/constants-common';
import { BACKEND_URL } from './constants-frontend';
import { useNotifications } from './NotificationsContext';

export const ReadLetter: React.FunctionComponent<RouteComponentProps> = () => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { addNotification } = useNotifications();
  const [letter, setLetter] = useState<ApiLetterContent | null>(null);
  const fetchLetter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef && formRef.current) {
      const { accessKey, accessPassword } = formRef.current;
      try {
        const credentials = {
          // @ts-ignore
          accessKey: accessKey.value,
          accessPassword: accessPassword.value,
        };
        const result = await axios.post(`${BACKEND_URL}/online-letter/read`, credentials);
        setLetter(result.data.data as ApiLetterContent);
      } catch (err) {
        console.log(err);
        addNotification({
          type: 'error',
          message: 'There has been an error fetching your message',
          timestamp: Date.now(),
        });
      }
    }
  };
  return (
    <>
      <h1>Read letter</h1>
      {letter && (
        <>
          <p>
            Here is the letter you have sent to us on{' '}
            {new Date(letter.created).toLocaleDateString('fi-FI')}
          </p>
          <h2>{letter.title}</h2>
          <LetterContent>{letter.content}</LetterContent>
        </>
      )}
      {!letter && (
        <form ref={formRef} onSubmit={fetchLetter}>
          <p className="field">
            <label htmlFor="accessKey">Access key</label>
            <input required type="text" id="accessKey" />
          </p>
          <p className="field">
            <label htmlFor="accessPassword">Access password</label>
            <input required type="password" id="accessPassword" />
          </p>
          <p className="field">
            <button type="submit" className="button">
              Read
            </button>
          </p>
        </form>
      )}
    </>
  );
};

const LetterContent = styled.pre`
  font-family: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol';
  font-size: 1rem;
  padding: 0;
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
  border: none;
  background: transparent;
  justify-content: left;
`;
