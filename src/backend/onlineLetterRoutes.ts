import express from 'express';

import { initiateLetter, sendLetter, readLetter } from './controllers/letterControllers';

const router = express.Router();

router.post('/start', async (_, res) => {
  const letter = await initiateLetter();
  if (!letter) {
    res.status(400).json({ error: 'unable to start a letter' });
    return;
  }
  res.status(201).json({ data: letter });
});

router.post('/send', async (req, res) => {
  const { uuid, title, content, accessKey, accessPassword } = req.body;
  const trimmedTitle = title ? title.trim() : '';
  const trimmedContent = content ? content.trim() : '';

  if (!uuid || !trimmedTitle || !trimmedContent || !accessKey || !accessPassword) {
    res.status(400).json({ error: 'missing title, content, accessKey or accessPassword' });
    return;
  }

  const letter = await sendLetter({
    uuid,
    accessKey,
    accessPassword,
    title: trimmedTitle,
    content: trimmedContent,
  });
  if (!letter) {
    res.status(400).json({ error: 'failed to send letter' });
    return;
  }
  res.status(201).json({ data: { success: true } });
});

router.post('/read', async (req, res) => {
  const { accessKey, accessPassword } = req.body;
  if (!accessKey || !accessPassword) {
    res.status(400).json({ error: 'missing title, content, accessKey or accessPassword' });
    return;
  }
  const letter = await readLetter({ accessKey, accessPassword });
  if (!letter) {
    res.status(403).json({ error: 'Wrong letter access credentials' });
    return;
  }
  const letterContent = {
    title: letter.title,
    content: letter.content,
    created: letter.created,
  };
  res.status(200).json({ data: letterContent });
});

export default router;
