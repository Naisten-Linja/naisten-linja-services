import React, { useState, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { Formik, Form, Field } from 'formik';

import { ApiPage, ApiUpdatePageParams } from '../../../common/constants-common';
import { useRequest } from '../../shared/http';
import { useNotifications } from '../../NotificationsContext';

export const EditContentPageForm: React.FC<{
  slug: string;
  afterSubmit: () => void;
  afterCancel: () => void;
}> = ({ slug: pageSlug, afterSubmit, afterCancel }) => {
  const [page, setPage] = useState<ApiPage | null>(null);
  const { getRequest, putRequest } = useRequest();
  const { addNotification } = useNotifications();

  useEffect(() => {
    let updateStateAfterFetch = true;

    const fetchPage = async () => {
      try {
        const result = await getRequest<{ data: ApiPage }>(
          `/api/pages/?slug=${encodeURIComponent(pageSlug)}`,
          { useJwt: true },
        );
        if (result.data.data && updateStateAfterFetch) {
          setPage(result.data.data);
        }
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'Unable to fetch front page content' });
      }
    };

    fetchPage();

    return () => {
      updateStateAfterFetch = false;
    };
  }, [pageSlug, setPage, addNotification, getRequest]);

  const updatePage = useCallback(
    async (uuid: string, { slug, content, title }: ApiUpdatePageParams) => {
      try {
        const result = await putRequest<{ data: ApiPage }>(
          `/api/pages/${uuid}`,
          { content, slug: slug.trim(), title: title.trim() },
          { useJwt: true },
        );
        if (result.data.data) {
          setPage(result.data.data);
          addNotification({ type: 'success', message: 'Page content was updated' });
        }
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'Unable to update page' });
      } finally {
        afterSubmit();
      }
    },
    [putRequest, addNotification, afterSubmit],
  );

  if (!page) {
    return null;
  }

  const { slug, title, content, uuid } = page;

  const initialFormValue: ApiUpdatePageParams = {
    title,
    slug,
    content,
  };

  return (
    <Formik
      onSubmit={(values) => {
        updatePage(uuid, values);
      }}
      initialValues={initialFormValue}
    >
      {({ setFieldValue, values }) => {
        const hasPendingChanges = title !== values.title.trim() || content !== values.content;
        return (
          <Form>
            <label htmlFor="field-title">Title</label>
            <Field id="field-title" type="text" name="title" />
            <label htmlFor="field-content">Content</label>
            <MDEditor
              value={values.content}
              height={500}
              textareaProps={{
                id: 'field-content',
                // Disable transparent text fill color upon focusing on the text area
                // @ts-ignore
                style: { '-webkit-text-fill-color': 'inherit' },
                minHeight: '300px',
              }}
              onChange={(content = '') => {
                setFieldValue('content', content);
              }}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
            />
            <button
              type="button"
              className="button margin-top-xxs margin-right-xxs"
              onClick={() => {
                afterCancel();
              }}
            >
              Cancel changes
            </button>
            <input
              className="button button-primary margin-top-xxs"
              style={{ width: 'auto' }}
              type="submit"
              value="Save changes"
              disabled={!hasPendingChanges}
            />
          </Form>
        );
      }}
    </Formik>
  );
};
