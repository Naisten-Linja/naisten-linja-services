import React, { useState, useRef } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import axios from 'axios';

import { BACKEND_URL } from './constants-frontend';
import { Button } from './ui-components/buttons';
import { useNotifications } from './NotificationsContext';
import type { LetterAccessInfo } from '../common/constants-common';

export const SendLetter = (props: RouteComponentProps) => {
  const [letterCredentials, setLetterCredentials] = useState<LetterAccessInfo | null>(null);
  const [isLetterSent, setIsLetterSent] = useState<boolean>(false);
  const { addNotification } = useNotifications();
  const formRef = useRef<HTMLFormElement | null>(null);

  const createLetter = async () => {
    try {
      const result = await axios.post(`${BACKEND_URL}/online-letter/start`);
      const credentials = {
        uuid: result.data.data.uuid,
        accessKey: result.data.data.accessKey,
        accessPassword: result.data.data.accessPassword,
      };
      setLetterCredentials(credentials);
    } catch (err) {
      addNotification({ type: 'error', message: 'Unable to start a letter, please try again.', timestamp: Date.now() });
    }
  };

  const sendLetter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef && letterCredentials) {
      // @ts-ignore
      const { title, content } = formRef.current;
      const { accessKey, accessPassword, uuid } = letterCredentials;
      try {
        const result = await axios.post(`${BACKEND_URL}/online-letter/send`, {
          uuid,
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
        addNotification({ type: 'error', message: 'There was an error in sending your letter', timestamp: Date.now() });
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
