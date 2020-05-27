import React, { useRef, useState } from 'react';
import { RouteComponentProps } from '@reach/router';

import type { ApiLetterContent } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';
import { useRequest } from './http';
import { LetterContent } from './ui-components/content';

export const ReadLetter: React.FunctionComponent<RouteComponentProps> = () => {
  const { addNotification } = useNotifications();
  const [letter, setLetter] = useState<ApiLetterContent | null>(null);
  const { postRequest } = useRequest();
  const formRef = useRef<HTMLFormElement | null>(null);

  const fetchLetter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef && formRef.current) {
      const { accessKey, accessPassword } = formRef.current;
      try {
        const letterCredentials = {
          // @ts-ignore
          accessKey: accessKey.value,
          accessPassword: accessPassword.value,
        };
        const result = await postRequest<{ data: ApiLetterContent }>(
          '/api/online-letter/read',
          letterCredentials,
          { useJwt: true },
        );
        setLetter(result.data.data);
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
