import React, { useEffect, useState } from 'react';
import { RouteComponentProps, Link } from '@reach/router';

import { useRequest } from './http';
import { ApiLetterAdmin } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';
import { LetterContent } from './ui-components/content';

export const Reply: React.FunctionComponent<RouteComponentProps<{ letterUuid: string }>> = ({
  letterUuid,
}) => {
  const { getRequest } = useRequest();
  const [letter, setLetter] = useState<ApiLetterAdmin | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const result = await getRequest<{ data: ApiLetterAdmin }>(`/api/letters/${letterUuid}`, {
          useJwt: true,
        });
        setLetter(result.data.data);
      } catch (err) {
        console.log(err);
        addNotification({
          type: 'error',
          message: 'Unable to fetch letter',
          timestamp: Date.now(),
        });
      }
    };
    fetchLetter();
  }, [getRequest]);

  return !letter ? null : (
    <>
      <Link to="/admin/letters">&lt; all letters</Link>
      <h1>{letter.title}</h1>
      <p>
        <i>
          <b>Created:</b> {new Date(letter.created).toLocaleString('fi-FI')}
        </i>
        <br />
        <i>
          <b>Status:</b> {letter.status}
        </i>
      </p>
      <LetterContent>{letter.content}</LetterContent>
      <form>
        <p className="field">
          <label htmlFor="reply">Reply to letter</label>
          <textarea required id="reply" rows={10} />
        </p>
        <p className="field">
          <button type="submit" className="button">
            Submit reply for review
          </button>
          <button type="submit" className="button">
            Save reply as draft
          </button>
        </p>
      </form>
    </>
  );
};
