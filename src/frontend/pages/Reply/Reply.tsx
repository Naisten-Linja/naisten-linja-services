import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';

import { useRequest } from '../../shared/http';
import {
  ApiLetterAdmin,
  ApiReplyAdmin,
  UserRole,
  ReplyStatus,
} from '../../../common/constants-common';
import { useNotifications } from '../../NotificationsContext';
import { useAuth } from '../../AuthContext';
import { LetterContent } from '../../ui-components/content';
import { Button, ButtonText } from '../../ui-components/buttons';
import moment from 'moment-timezone';

export const Reply: React.FunctionComponent<RouteComponentProps<{ letterUuid: string }>> = ({
  letterUuid,
}) => {
  const { getRequest, postRequest, putRequest, deleteRequest } = useRequest();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [letter, setLetter] = useState<ApiLetterAdmin | null>(null);
  const [reply, setReply] = useState<ApiReplyAdmin | null>(null);
  const [content, setContent] = useState<string>('');
  const disableReplyEdit =
    user && user.role === UserRole.volunteer && reply && reply.status !== ReplyStatus.draft;
  const showSendForReviewBtn = !reply || reply.status === ReplyStatus.draft;
  const showPublishBtn = reply && reply.status === ReplyStatus.in_review;
  const formRef = useRef<HTMLFormElement | null>(null);
  const letterFormRef = useRef<HTMLFormElement | null>(null);
  const [letterContent, setLetterContent] = useState<string>('');
  const disableLetterEdit = user && user.role === UserRole.volunteer;
  const [letterEdit, setLetterEdit] = useState<boolean>(false);

  const sendReply = async (status: ReplyStatus) => {
    if (formRef && letter) {
      // @ts-ignore
      const { replyContent } = formRef.current;
      try {
        // If there is no reply for letter, create a new reply
        if (!reply) {
          const result = await postRequest<{ data: ApiReplyAdmin }>(
            `/api/letters/${letter.uuid}/reply`,
            {
              letterUuid: letter.uuid,
              content: replyContent.value,
              status,
            },
            { useJwt: true },
          );
          setReply(result.data.data);
        } else {
          // Otherwise, update existing one
          // @ts-ignore
          const { replyUuid } = formRef.current;
          const result = await postRequest<{ data: ApiReplyAdmin }>(
            `/api/letters/${letter.uuid}/reply/${replyUuid.value}`,
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
      const result = await getRequest<{ data: ApiReplyAdmin | null }>(
        `/api/letters/${letterUuid}/reply`,
        {
          useJwt: true,
        },
      );
      setReply(result.data.data || null);
      if (result.data.data) setContent(result.data.data.content);
    } catch (err) {
      console.log(err);
      addNotification({
        type: 'error',
        message: 'Unable to fetch reply',
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
        if (result.data.data.content) setLetterContent(result.data.data.content);
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'Unable to fetch letter' });
      }
    };
    fetchLetter();
    fetchReply();
  }, [getRequest, letterUuid, addNotification, fetchReply]);

  const updateLetterContent = async () => {
    if (letterFormRef && letter) {
      // @ts-ignore
      const { letterContent } = letterFormRef.current;
      try {
        const result = await putRequest<{ data: ApiLetterAdmin }>(
          `/api/letters/${letter.uuid}`,
          {
            letterUuid: letter.uuid,
            title: letter.title,
            content: letterContent.value,
          },
          { useJwt: true },
        );
        setLetter(result.data.data);
        addNotification({ type: 'success', message: `Letter content has been updated` });
        setLetterEdit(false);
      } catch (err) {
        console.log(err);
        addNotification({
          type: 'error',
          message: 'There was an error saving the letter content',
        });
      }
    }
  };

  const deleteLetter = async () => {
    // Only staff who can delete the letter.
    // On successful attempt, the user will be redirected to admin/letters page.
    if (!letter) return;
    if (window.confirm('Are you sure to delete this letter?')) {
      const deleteResult = await deleteRequest<{ data: { success: boolean } }>(
        `/api/letters/${letter.uuid}`,
        { useJwt: true },
      );
      if (deleteResult.data.data.success) {
        addNotification({ type: 'success', message: 'Letter and reply were successfully deleted' });
        window.location.replace('/admin/letters');
      } else {
        addNotification({ type: 'error', message: 'Failed to delete letter' });
      }
    }
  };

  const editLetterForm = (
    <form ref={letterFormRef}>
      {letter && <input type="hidden" value={letter.uuid} id="letterUuid" disabled />}
      <div className="field">
        <MDEditor
          value={letterContent}
          height={200}
          hideToolbar={true}
          preview="edit"
          textareaProps={{
            id: 'letterContent',
            disabled: !letterEdit,
            // Disable transparent text fill color upon focusing on the text area
            // @ts-ignore
            style: { '-webkit-text-fill-color': 'inherit' },
          }}
          onChange={(val = '') => {
            if (val) setLetterContent(val);
            else setLetterContent('');
          }}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]],
          }}
        />
      </div>
      <div className="padding-xs color-white background-warning">
        Do not attempt to change the content unless you know what you are doing.
      </div>

      <p className="field">
        {letterEdit ? (
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              updateLetterContent();
            }}
          >
            Save changes
          </Button>
        ) : (
          <ButtonText
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setLetterEdit(true);
            }}
          >
            Edit letter content
          </ButtonText>
        )}
      </p>
    </form>
  );

  const editForm = (
    <form ref={formRef} onSubmit={submitReply}>
      {reply && <input type="hidden" value={reply.uuid} id="replyUuid" disabled />}
      <div className="field">
        <MDEditor
          value={content}
          height={500}
          textareaProps={{
            id: 'replyContent',
            // Disable transparent text fill color upon focusing on the text area
            // @ts-ignore
            style: { '-webkit-text-fill-color': 'inherit' },
            minHeight: '300px',
          }}
          onChange={(val = '') => {
            if (val) setContent(val);
            else setContent('');
          }}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]],
          }}
        />
      </div>
      <p className="field">
        {showSendForReviewBtn && (
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              sendReply(ReplyStatus.in_review);
            }}
          >
            Submit reply for review
          </Button>
        )}

        {showPublishBtn && (
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              sendReply(ReplyStatus.published);
            }}
          >
            Publish reply
          </Button>
        )}

        <ButtonText
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            sendReply(ReplyStatus.draft);
          }}
        >
          {reply && reply.status === ReplyStatus.published
            ? 'Unpublish reply'
            : 'Save reply as draft'}
        </ButtonText>
      </p>
    </form>
  );

  const replyContent = !reply ? null : <LetterContent>{reply.content}</LetterContent>;

  return !letter || !user ? null : (
    <>
      <Link to={user.role === UserRole.staff ? '/admin/letters' : '/volunteer/letters'}>
        &lt; all letters
      </Link>
      <h1>Letter</h1>
      <h3>{letter.title}</h3>
      <p>
        <i>
          <b>Created:</b> {moment(letter.created).format('dddd DD/MM/YYYY, HH:mm')}
        </i>
      </p>

      {disableLetterEdit ? <LetterContent>{letter.content}</LetterContent> : editLetterForm}

      <h1>Reply</h1>
      {reply && (
        <p>
          <i>
            <b>Updated on:</b>{' '}
            {reply.statusTimestamp
              ? moment(reply.statusTimestamp).format('dddd DD/MM/YYYY, HH:mm')
              : 'never'}
          </i>
          <br />
          <i>
            <b>Status:</b> {reply.status}
          </i>
          <br />
          <i>
            <b>Read on:</b>{' '}
            {reply?.readTimestamp
              ? moment(reply?.readTimestamp).format('dddd DD/MM/YYYY, HH:mm')
              : '-'}
          </i>
        </p>
      )}
      {disableReplyEdit ? replyContent : editForm}

      {user.role === UserRole.staff && (
        <>
          <h1 className="color-warning">Danger zone</h1>
          <div className="flex flex-row flex-wrap border border-color-warning padding-s">
            <div>
              <p className="color-warning font-weight-bold">
                Delete this letter and the corresponding reply
              </p>
              <p>
                Once you delete this letter, there is no going back. This will delete the letter and
                the reply permanently from the data storage.
              </p>
            </div>
            <div className="margin-auto">
              <Button
                className="button warning button-border"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  deleteLetter();
                }}
              >
                Delete this letter
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};