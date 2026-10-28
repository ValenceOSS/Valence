import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import { htmlMarkup } from './htmlMarkup';
import { noticeBodyOf } from './noticeBodyOf';
import { fitEscaped } from './fitEscaped';
import type { WebhookNotice } from './webhookNoticeFor';

const TEXT_LIMIT = 4096;

const TITLE_LIMIT = 256;

const ZERO_WIDTH_SPACE = '​';

type TelegramMessage = {
  chat_id?: string;
  message_thread_id?: string;
  text: string;
  parse_mode: 'HTML';
  link_preview_options: { is_disabled: true } | { url: string; prefer_large_media: true };
};

/**
 * Writes one event as a Telegram bot's sendMessage, as Sonarr does: the title in bold above the
 * details, in Telegram's HTML, inside the 4096 characters it accepts. The poster is shown as the
 * message's link preview, carried by a link with nothing to read in it, and any other preview is
 * turned off. The chat and topic are passed on from the address.
 *
 * @param notice - What to say.
 * @param settings - What the subscription's address says beyond where it is.
 * @returns The message.
 */
const telegramMessageFor = (
  notice: WebhookNotice,
  settings: Record<string, string>,
): TelegramMessage => {
  const poster =
    notice.posterUrl === null
      ? ''
      : `<a href="${escapeHtml(notice.posterUrl)}">${ZERO_WIDTH_SPACE}</a>`;
  const title = htmlMarkup.bold(fitEscaped(notice.title, TITLE_LIMIT, escapeHtml));
  const body = noticeBodyOf(
    notice,
    htmlMarkup,
    TEXT_LIMIT - poster.length - title.length - '\n\n'.length,
  );

  return {
    ...(settings.chat_id === undefined ? {} : { chat_id: settings.chat_id }),
    ...(settings.message_thread_id === undefined
      ? {}
      : { message_thread_id: settings.message_thread_id }),
    text: `${poster}${title}${body === '' ? '' : `\n\n${body}`}`,
    parse_mode: 'HTML',
    link_preview_options:
      notice.posterUrl === null
        ? { is_disabled: true }
        : { url: notice.posterUrl, prefer_large_media: true },
  };
};

export { telegramMessageFor };

export type { TelegramMessage };
