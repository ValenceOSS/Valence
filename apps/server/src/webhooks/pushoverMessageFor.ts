import { htmlMarkup } from './htmlMarkup';
import { noticeBodyOf } from './noticeBodyOf';
import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import { clipText } from './clipText';
import { fitEscaped } from './fitEscaped';
import type { PosterAttachment } from './fetchPosterAttachment';
import type { WebhookNotice } from './webhookNoticeFor';

const MESSAGE_LIMIT = 1024;

const TITLE_LIMIT = 250;

const URGENT_PRIORITY = 1;

const ORDINARY_PRIORITY = 0;

type PushoverMessage = {
  token?: string;
  user?: string;
  device?: string;
  sound?: string;
  title?: string;
  message: string;
  html: 1;
  priority: number;
  timestamp: number;
  attachment_base64?: string;
  attachment_type?: string;
};

/**
 * Writes one event as a Pushover message: the title, the details in the HTML Pushover shows once the
 * notification is opened, inside the 1024 characters it accepts, stamped with when it happened. A
 * problem somebody has to put right is sent at high priority, which Pushover lets through quiet
 * hours, as Seerr does for a failure. The application token, user key, device and sound are passed
 * on from the address, since Pushover reads them from the body, and the poster is attached where
 * Valence could fetch it.
 *
 * @param notice - What to say.
 * @param settings - What the subscription's address says beyond where it is.
 * @param occurredAt - When it happened.
 * @param poster - The poster, fetched ahead of time, if it could be.
 * @returns The message.
 */
const pushoverMessageFor = (
  notice: WebhookNotice,
  settings: Record<string, string>,
  occurredAt: string,
  poster: PosterAttachment | null = null,
): PushoverMessage => {
  const body = noticeBodyOf(notice, htmlMarkup, MESSAGE_LIMIT);

  return {
    ...(settings.token === undefined ? {} : { token: settings.token }),
    ...(settings.user === undefined ? {} : { user: settings.user }),
    ...(settings.device === undefined ? {} : { device: settings.device }),
    ...(settings.sound === undefined ? {} : { sound: settings.sound }),
    ...(body === '' ? {} : { title: clipText(notice.title, TITLE_LIMIT) }),
    message: body === '' ? fitEscaped(notice.title, MESSAGE_LIMIT, escapeHtml) : body,
    html: 1,
    priority: notice.isUrgent ? URGENT_PRIORITY : ORDINARY_PRIORITY,
    timestamp: Math.floor(Date.parse(occurredAt) / 1000),
    ...(poster === null ? {} : { attachment_base64: poster.base64, attachment_type: poster.type }),
  };
};

export { pushoverMessageFor };

export type { PushoverMessage };
