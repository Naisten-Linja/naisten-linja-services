import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';

import { useRequest } from './http';
import { ApiLetterAdmin, ApiReplyAdmin, UserRole, ReplyStatus } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';
import { LetterContent } from './ui-components/content';
import { Button, ButtonText } from './ui-components/buttons';

export const Reply: React.FunctionComponent<RouteComponentProps<{ letterUuid: string }>> = ({
  letterUuid,
}) => {
  const { getRequest, postRequest } = useRequest();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [letter, setLetter] = useState<ApiLetterAdmin | null>(null);
  const [reply, setReply] = useState<ApiReplyAdmin | null>(null);
  const disableReplyEdit =
    user && user.role === UserRole.volunteer && reply && reply.status !== ReplyStatus.draft;
  const formRef = useRef<HTMLFormElement | null>(null);

  const sendReply = async (status: ReplyStatus) => {
    if (formRef && letter) {
      // @ts-ignore
      const { replyContent } = formRef.current;
      try {
        // If there is no replies for letter, create a new reply
        if (!reply) {
          const result = await postRequest<{ data: ApiReplyAdmin }>(
            `/api/letters/${letter.uuid}/replies`,
            { letterUuid: letter.uuid, content: replyContent.value, status },
            { useJwt: true },
          );
          setReply(result.data.data);
        } else {
          // Otherwise, update existing one
          // @ts-ignore
          const { replyUuid } = formRef.current;
          const result = await postRequest<{ data: ApiReplyAdmin }>(
            `/api/letters/${letter.uuid}/replies/${replyUuid.value}`,
            {
              status,
              letterUuid: letter.uuid,
              content: replyContent.value,
            },
            { useJwt: true },
          );
          setReply(result.data.data);
        }
        addNotification({ type: 'success', message: `Reply was saved with status ${status}` });
      } catch (err) {
        console.log(err);
        addNotification({
          type: 'error',
          message: 'There was an error saving the reply',
          timestamp: Date.now(),
        });
      }
    }
  };

  const submitReply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendReply(ReplyStatus.in_review);
  };

  const fetchReply = useCallback(async () => {
    try {
      const result = await getRequest<{ data: Array<ApiReplyAdmin> }>(
        `/api/letters/${letterUuid}/replies`,
        {
          useJwt: true,
        },
      );
      setReply(result.data.data[0] || null);
    } catch (err) {
      console.log(err);
      addNotification({
        type: 'error',
        message: 'Unable to fetch replies',
        timestamp: Date.now(),
      });
    }
  }, [setReply, addNotification, getRequest, letterUuid]);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const result = await getRequest<{ data: ApiLetterAdmin }>(`/api/letters/${letterUuid}`, {
          useJwt: true,
        });
        setLetter(result.data.data);
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'Unable to fetch letter' });
      }
    };
    fetchLetter();
    fetchReply();
  }, [getRequest, letterUuid, addNotification, fetchReply]);

  const editForm = (
    <form ref={formRef} onSubmit={submitReply}>
      {reply && <input type="hidden" value={reply.uuid} id="replyUuid" disabled />}
      <p className="field">
        <textarea required id="replyContent" rows={10} defaultValue={reply ? reply.content : ''} />
      </p>
      <p className="field">
        <Button>Submit reply for review</Button>
        <ButtonText
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            sendReply(ReplyStatus.draft);
          }}
        >
          Save reply as draft
        </ButtonText>
      </p>
    </form>
  );

  const replyContent = !reply ? null : <LetterContent>{reply.content}</LetterContent>;

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

      <h1>Reply</h1>
      {reply && (
        <p>
          <i>
            <b>Updated on:</b> {new Date(reply.updated).toLocaleString('fi-FI')}
          </i>
          <br />
          <i>
            <b>Status:</b> {reply.status}
          </i>
        </p>
      )}

      {disableReplyEdit ? replyContent : editForm}
    </>
  );
};
