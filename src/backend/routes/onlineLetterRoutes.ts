import express from 'express';
import moment from 'moment';
import { RecipientStatus } from '../../common/constants-common';

import { initiateLetter, sendLetter, readLetter } from '../controllers/letterControllers';
import { updateLettersReplyRecipientStatus } from '../controllers/replyControllers';

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
  const { title, content, accessKey, accessPassword } = req.body;
  const trimmedTitle = title ? title.trim() : '';
  const trimmedContent = content ? content.trim() : '';

  if (!trimmedTitle || !trimmedContent || !accessKey || !accessPassword) {
    res.status(400).json({ error: 'missing title, content, accessKey or accessPassword' });
    return;
  }

  const letter = await sendLetter({
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
  const { letter, reply } = await readLetter({ accessKey, accessPassword });
  if (!letter) {
    res.status(403).json({ error: 'Wrong letter access credentials' });
    return;
  }

  // When recipient opens the reply for the first time, it will update its recipient status to "read".
  if (reply?.recipientStatus === null || reply?.recipientStatus === RecipientStatus.unread) {
    const success = await updateLettersReplyRecipientStatus(reply.uuid, RecipientStatus.read, new Date());
    if (!success) {
      res.status(403).json({ error: 'Cannot update recipient status' });
      return;
    }
  }

  const letterContent = {
    title: letter.title,
    content: letter.content,
    created: letter.created,
    replyContent: reply ? reply.content : null,
    replyUpdated: reply ? reply.updated : null,
  };
  res.status(200).json({ data: letterContent });
});

export default router;
