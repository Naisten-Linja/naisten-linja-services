import * as pageModel from './models/pages';

import { ApiPage } from '../common/constants-common';

export async function getAllPages(): Promise<Array<ApiPage> | null> {
  const pages = await pageModel.getAllPages();
  if (pages === null) {
    return null;
  }
  return pages.map(({ uuid, slug, title, content }) => ({ uuid, slug, title, content }));
}

export async function updatePage(params: pageModel.UpdatePageParams): Promise<ApiPage | null> {
  const updatedPage = await pageModel.updatePage(params);
  if (!updatedPage) {
    return null;
  }
  return pageModelToApiPage(updatedPage);
}

export async function getPageBySlug(slug: string): Promise<ApiPage | null> {
  const page = await pageModel.getPageBySlug(slug);
  if (!page) {
    return null;
  }
  return pageModelToApiPage(page);
}

function pageModelToApiPage(page: pageModel.Page): ApiPage {
  const { uuid, slug, title, content } = page;
  return {
    uuid,
    slug,
    title,
    content,
  };
}
