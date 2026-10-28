import { markdownMarkup } from './markdownMarkup';
import { noticeBodyOf } from './noticeBodyOf';
import type { WebhookNotice } from './webhookNoticeFor';

const URGENT_PRIORITY = 8;

const ORDINARY_PRIORITY = 5;

type GotifyMessage = {
  title?: string;
  message: string;
  priority: number;
  extras: {
    'client::display': { contentType: 'text/markdown' };
    'client::notification'?: { bigImageUrl: string };
  };
};

/**
 * Writes one event as a Gotify message, as Sonarr does: the title, the details in Markdown, the
 * poster beneath them and as the notification's picture on Android, and a priority high enough to break through for a problem
 * somebody has to put right. An event with nothing beyond its title is sent as the message alone,
 * since Gotify needs one and shows the application's name where there is no title.
 *
 * @param notice - What to say.
 * @returns The message.
 */
const gotifyMessageFor = (notice: WebhookNotice): GotifyMessage => {
  const written = noticeBodyOf(notice, markdownMarkup);
  const body =
    notice.posterUrl === null || written === ''
      ? written
      : `${written}\n\n![](${notice.posterUrl.replaceAll('(', '%28').replaceAll(')', '%29').replaceAll(' ', '%20')})`;

  return {
    ...(body === '' ? {} : { title: notice.title }),
    message: body === '' ? markdownMarkup.escape(notice.title) : body,
    priority: notice.isUrgent ? URGENT_PRIORITY : ORDINARY_PRIORITY,
    extras: {
      'client::display': { contentType: 'text/markdown' },
      ...(notice.posterUrl === null
        ? {}
        : { 'client::notification': { bigImageUrl: notice.posterUrl } }),
    },
  };
};

export { gotifyMessageFor };

export type { GotifyMessage };
