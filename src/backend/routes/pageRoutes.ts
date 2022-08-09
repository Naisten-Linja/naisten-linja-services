import express from 'express';

import { getPageBySlug, updatePage } from '../controllers/pageControllers';
import { ApiPage, ApiUpdatePageParams, UserRole } from '../../common/constants-common';
import { isAuthenticated } from '../middlewares';

const router = express.Router();

router.get<
  Record<string, never>,
  { data: ApiPage } | { error: string },
  Record<string, never>,
  { slug: string }
>('/', isAuthenticated([UserRole.staff, UserRole.volunteer]), async (req, res) => {
  const { slug } = req.query;
  const page = await getPageBySlug(slug);
  if (!page) {
    res.status(404).json({ error: 'page not found' });
    return;
  }
  res.status(200).json({ data: page });
});

router.put<{ uuid: string }, { data: ApiPage } | { error: string }, ApiUpdatePageParams>(
  '/:uuid',
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { uuid } = req.params;
    const { title = '', content = '', slug } = req.body;
    if (!slug) {
      res.status(400).json({ error: 'slug is missing from request body' });
      return;
    }
    const updatedPage = await updatePage({ uuid, title, content, slug });
    if (!updatedPage) {
      res.status(400).json({ error: 'failed top update page' });
      return;
    }

    res.status(200).json({ data: updatedPage });
  },
);

export default router;
