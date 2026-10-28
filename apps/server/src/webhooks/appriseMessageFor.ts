import { markdownMarkup } from './markdownMarkup';
import { noticeBodyOf } from './noticeBodyOf';
import type { WebhookNotice, WebhookTone } from './webhookNoticeFor';

type AppriseType = 'info' | 'success' | 'warning' | 'failure';

const TYPES: Record<WebhookTone, AppriseType> = {
  failure: 'warning',
  attention: 'warning',
  arrival: 'success',
  viewing: 'info',
  quiet: 'info',
};

type AppriseMessage = {
  title: string;
  body: string;
  type: AppriseType;
  format: 'markdown';
};

/**
 * Writes one event for Apprise's API, which passes it on to whichever services it is configured to
 * reach: the title, the details in Markdown for Apprise to convert for each, and a type it shows as
 * an icon or colour — a failure only for a problem somebody has to put right. Apprise reads a tag
 * from the address itself.
 *
 * @param notice - What to say.
 * @returns The message.
 */
const appriseMessageFor = (notice: WebhookNotice): AppriseMessage => {
  const body = noticeBodyOf(notice, markdownMarkup);

  return {
    title: body === '' ? '' : notice.title,
    body: body === '' ? markdownMarkup.escape(notice.title) : body,
    type: notice.isUrgent ? 'failure' : TYPES[notice.tone],
    format: 'markdown',
  };
};

export { appriseMessageFor };

export type { AppriseMessage };
