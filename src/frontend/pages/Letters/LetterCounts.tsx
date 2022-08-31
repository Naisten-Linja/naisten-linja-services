import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
  ApiLetterWithReadStatus,
  ReadReceiptStatus,
  ReplyStatus,
} from '../../../common/constants-common';
import { namespaces } from '../../i18n/i18n.constants';

interface LetterCountsProps {
  letters: Array<ApiLetterWithReadStatus>;
}

export const LetterCounts = ({ letters }: LetterCountsProps) => {
  const { t } = useTranslation(namespaces.pages.letters);

  const noReply = letters.filter((letter) => letter.replyStatus === null).length;
  const draft = letters.filter((letter) => letter.replyStatus === ReplyStatus.draft).length;
  const inReview = letters.filter((letter) => letter.replyStatus === ReplyStatus.in_review).length;

  const unread = letters.filter(
    (letter) =>
      letter.replyStatus === ReplyStatus.published &&
      letter.replyReadReceipt === ReadReceiptStatus.unread,
  ).length;
  const read = letters.filter(
    (letter) =>
      letter.replyStatus === ReplyStatus.published &&
      letter.replyReadReceipt === ReadReceiptStatus.read,
  ).length;

  return (
    <>
      <CountRow className="box-shadow-m border-radius">
        <Count>
          <b>{t('letter_counts.total')}</b> <span>{letters.length}</span>
        </Count>
        <Count>
          <b>{t('letter_counts.no_reply')}</b> <span>{noReply}</span>
        </Count>
        <Count>
          <b>{t('letter_counts.draft')}</b> <span>{draft}</span>
        </Count>
        <Count>
          <b>{t('letter_counts.in_review')}</b> <span>{inReview}</span>
        </Count>
        <Count>
          <b>
            {t('letter_counts.published')}
            <br />
            {t('letter_counts.not_read')}
          </b>
          <span>{unread}</span>
        </Count>
        <Count>
          <b>
            {t('letter_counts.published')}
            <br />
            {t('letter_counts.read')}
          </b>
          <span>{read}</span>
        </Count>
      </CountRow>
    </>
  );
};

const CountRow = styled.ul`
  display: flex;
  flex-wrap: wrap;
  border-left: 1px solid #dddddd;
  border-bottom: 1px solid #dddddd;
  overflow: hidden;
  margin: 1rem 0;
`;

const Count = styled.li`
  display: flex;
  flex: 1;
  align-items: center;

  margin: 0;
  padding: 0.5rem 1rem;
  text-align: center;
  border-top: 1px solid #dddddd;
  border-right: 1px solid #dddddd;
  vertical-align: center;

  & > b {
    flex-grow: 1;
    display: inline-block;
    line-height: 1.1;
    font-size: 0.9rem;
    text-align: left;
  }

  & > span {
    font-size: 1.5rem;
    display: inline-block;
    padding-left: 1rem;
  }
`;
