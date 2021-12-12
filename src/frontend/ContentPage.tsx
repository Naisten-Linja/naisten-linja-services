import React, { useEffect, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';

import { ApiPage } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';
import { useRequest } from './http';

export const ContentPage: React.FC<{ slug: string }> = ({ slug }) => {
  const [page, setPage] = useState<ApiPage | null>();
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  useEffect(() => {
    let updateStateAfterFetch = true;
    const fetchPage = async () => {
      try {
        const result = await getRequest<{ data: ApiPage }>(
          `/api/pages/?slug=${encodeURIComponent(slug)}`,
          { useJwt: true },
        );
        if (result.data.data && updateStateAfterFetch) {
          setPage(result.data.data);
        }
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'Unable to fetch page content' });
      }
    };

    fetchPage();

    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setPage, addNotification, slug]);

  if (!page) {
    return null;
  }

  return (
    <div className="width-100">
      <h1>{page.title}</h1>
      <div className="width-100">
        <MDEditor.Markdown source={page.content} />
      </div>
    </div>
  );
};
