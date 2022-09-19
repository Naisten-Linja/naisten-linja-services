import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import { useRequest } from '../../shared/http';
import {
  ApiLetterAdmin,
  ApiReplyAdmin,
  UserRole,
  ReplyStatus,
  ApiReplyParamsAdmin,
} from '../../../common/constants-common';
import { useNotifications } from '../../NotificationsContext';
import { useAuth } from '../../AuthContext';
import { LetterContent } from '../../ui-components/content';
import { Button, ButtonText } from '../../ui-components/buttons';
import moment from 'moment-timezone';

export const Reply: React.FC = () => {
  const { letterUuid } = useParams<{ letterUuid: string }>();
  const { t } = useTranslation(namespaces.pages.reply);

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
        const body: ApiReplyParamsAdmin = {
          status,
          content: replyContent.value,
        };
        // If there is no reply for letter, create a new reply
        if (!reply) {
          const result = await postRequest<{ data: ApiReplyAdmin }>(
            `/api/letters/${letter.uuid}/reply`,
            body,
            { useJwt: true },
          );
          setReply(result.data.data);
        } else {
          // Otherwise, update existing one
          // @ts-ignore
          const { replyUuid } = formRef.current;
          const result = await postRequest<{ data: ApiReplyAdmin }>(
            `/api/letters/${letter.uuid}/reply/${replyUuid.value}`,
            body,
            { useJwt: true },
          );
          setReply(result.data.data);
        }
        addNotification({ type: 'success', message: t('send_reply_success', { status }) });
      } catch (err) {
        console.log(err);
        addNotification({
          type: 'error',
          message: t('send_reply_error'),
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
        message: t('fetch_reply_error'),
      });
    }
  }, [getRequest, letterUuid, addNotification, t]);

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
        addNotification({ type: 'error', message: t('fetch_letter_error') });
      }
    };
    fetchLetter();
    fetchReply();
  }, [getRequest, letterUuid, addNotification, fetchReply, t]);

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
        addNotification({ type: 'success', message: t('update_letter_content_success') });
        setLetterEdit(false);
      } catch (err) {
        console.log(err);
        addNotification({
          type: 'error',
          message: t('update_letter_content_error'),
        });
      }
    }
  };

  const deleteLetter = async () => {
    // Only staff who can delete the letter.
    // On successful attempt, the user will be redirected to admin/letters page.
    if (!letter) return;
    if (window.confirm(t('delete_letter'))) {
      const deleteResult = await deleteRequest<{ data: { success: boolean } }>(
        `/api/letters/${letter.uuid}`,
        { useJwt: true },
      );
      if (deleteResult.data.data.success) {
        addNotification({ type: 'success', message: t('delete_letter_success') });
        window.location.replace('/admin/letters');
      } else {
        addNotification({ type: 'error', message: t('delete_letter_error') });
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
        {t('edit_letter_form.warning')}
      </div>

      <p className="field">
        {letterEdit ? (
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              updateLetterContent();
            }}
          >
            {t('edit_letter_form.button.save_changes')}
          </Button>
        ) : (
          <ButtonText
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setLetterEdit(true);
            }}
          >
            {t('edit_letter_form.button.edit_letter_content')}
          </ButtonText>
        )}
      </p>
    </form>
  );

  const editReplyForm = (
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
      {showPublishBtn && letter?.hasEmail && (
        <p className="color-primary-800 font-weight-bold font-size-s">
          {t('edit_reply_form.customer_will_get_email_notification')}
        </p>
      )}
      <p className="field">
        {showSendForReviewBtn && (
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              sendReply(ReplyStatus.in_review);
            }}
          >
            {t('edit_reply_form.button.submit_reply_for_review')}
          </Button>
        )}

        {showPublishBtn && (
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              sendReply(ReplyStatus.published);
            }}
          >
            {t('edit_reply_form.button.publish_reply')}
          </Button>
        )}

        <ButtonText
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            sendReply(ReplyStatus.draft);
          }}
        >
          {reply && reply.status === ReplyStatus.published
            ? t('edit_reply_form.button.unpublish_reply')
            : t('edit_reply_form.button.save_draft')}
        </ButtonText>
      </p>
    </form>
  );

  const replyContent = !reply ? null : <LetterContent>{reply.content}</LetterContent>;

  return !letter || !user ? null : (
    <>
      <Link to={user.role === UserRole.staff ? '/admin/letters' : '/volunteer/letters'}>
        &lt; {t('back_link')}
      </Link>
      <h1>{t('letter.title')}</h1>
      <h3>{letter.title}</h3>
      <p className="font-style-italic">
        <b>{t('letter.created')}:</b> {moment(letter.created).format('dddd DD/MM/YYYY, HH:mm')}
        <br />
        <b>{t('letter.customer_has_given_email')}:</b>{' '}
        {letter.hasEmail ? t('letter.yes') : t('letter.no')}
      </p>

      {disableLetterEdit ? <LetterContent>{letter.content}</LetterContent> : editLetterForm}

      <h1>{t('reply.title')}</h1>
      {reply && (
        <p>
          <i>
            <b>{t('reply.updated_on')}:</b>{' '}
            {reply.statusTimestamp
              ? moment(reply.statusTimestamp).format('dddd DD/MM/YYYY, HH:mm')
              : t('reply.never')}
          </i>
          <br />
          <i>
            <b>{t('reply.status')}:</b> {reply.status}
          </i>
          <br />
          <i>
            <b>{t('reply.read_on')}:</b>{' '}
            {reply?.readTimestamp
              ? moment(reply?.readTimestamp).format('dddd DD/MM/YYYY, HH:mm')
              : t('reply.never')}
          </i>
        </p>
      )}
      {disableReplyEdit ? replyContent : editReplyForm}

      {user.role === UserRole.staff && (
        <>
          <h1 className="color-warning">{t('danger_zone.title')}</h1>
          <div className="flex flex-row flex-wrap border border-color-warning padding-s">
            <div>
              <p className="color-warning font-weight-bold">{t('danger_zone.p_1')}</p>
              <p>{t('danger_zone.p_2')}</p>
            </div>
            <div className="margin-auto">
              <Button
                className="button warning button-border"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  deleteLetter();
                }}
              >
                {t('danger_zone.delete_button')}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
