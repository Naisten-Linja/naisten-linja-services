import React, { useState, useRef } from 'react';
import { RouteComponentProps, Link } from '@reach/router';

import type { ApiLetterCredentials } from '../common/constants-common';
import { Button } from './ui-components/buttons';
import { useNotifications } from './NotificationsContext';
import { useRequest } from './http';

export const SendLetter: React.FunctionComponent<RouteComponentProps> = () => {
  const [letterCredentials, setLetterCredentials] = useState<ApiLetterCredentials | null>(null);
  const [isLetterSent, setIsLetterSent] = useState<boolean>(false);
  const { addNotification } = useNotifications();
  const { postRequest } = useRequest();

  const formRef = useRef<HTMLFormElement | null>(null);

  const createLetter = async () => {
    try {
      const result = await postRequest('/api/online-letter/start');
      const credentials = {
        accessKey: result.data.data.accessKey,
        accessPassword: result.data.data.accessPassword,
      };
      setLetterCredentials(credentials);
    } catch (err) {
      addNotification({ type: 'error', message: 'Unable to start a letter, please try again.' });
    }
  };

  const sendLetter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef && letterCredentials) {
      // @ts-ignore
      const { title, content } = formRef.current;
      const { accessKey, accessPassword } = letterCredentials;
      try {
        const result = await postRequest('/api/online-letter/send', {
          accessKey,
          accessPassword,
          title: title.value,
          content: content.value,
        });
        if (result.data.data.success) {
          setIsLetterSent(true);
          setLetterCredentials(null);
        }
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'There was an error in sending your letter' });
      }
    }
  };

  return (
    <>
      <h1>Online letter</h1>
      {isLetterSent && <div>Your letter has been sent!</div>}
      {(!letterCredentials || isLetterSent) && (
        <>
          <p>
            <Button onClick={createLetter}>Write us a letter</Button>
          </p>
          <p>or</p>
          <p>
            <Link to="/read">Read a letter that you sent to us</Link>
          </p>
        </>
      )}
      {letterCredentials && (
        <>
          <p>
            Access key: {letterCredentials.accessKey}
            <br />
            Access password: {letterCredentials.accessPassword}
          </p>
          <form onSubmit={sendLetter} ref={formRef}>
            <p className="field">
              <label htmlFor="title">Title</label>
              <input required type="text" id="title" placeholder="Your letter's title" />
            </p>
            <p className="field">
              <label htmlFor="content">Message</label>
              <textarea required id="content" placeholder="Your message" rows={10} />
            </p>
            <p className="field">
              <button type="submit" className="button">
                Send letter
              </button>
            </p>
          </form>
        </>
      )}
    </>
  );
};
