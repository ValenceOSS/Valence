import { clipText } from './clipText';
import { discordMarkup } from './discordMarkup';
import { noticeBodyOf } from './noticeBodyOf';
import { webhookNoticeFor } from './webhookNoticeFor';
import type { WebhookTone } from './webhookNoticeFor';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';
import { VALENCE_BRAND } from './VALENCE_BRAND';
import type { WebhookBrand } from './WebhookBrand';

const COLOURS: Record<WebhookTone, number> = {
  failure: 0xe8503a,
  attention: 0xe8a33a,
  arrival: 0x3ac47d,
  viewing: 0x3a8ee8,
  quiet: 0x8b5ce8,
};

const EVERYDAY: ReadonlySet<WebhookTone> = new Set(['viewing', 'quiet']);

const TITLE_LIMIT = 256;

const DESCRIPTION_LIMIT = 4096;

const FOOTER_LIMIT = 2048;

const EMBED_LIMIT = 6000;

type DiscordEmbed = {
  title: string;
  description?: string;
  color: number;
  author: { name: string; icon_url?: string };
  timestamp: string;
  footer?: { text: string };
  thumbnail?: { url: string };
};

/**
 * Draws an event as a Discord embed, signed with the server's name and icon at the head, in its
 * accent where nothing is wrong, with the poster beside and which part of it the news came from at
 * the foot.
 *
 * @param payload - What happened.
 * @param brand - How the server signs its messages: its name, its icon and its accent.
 * @returns The embed.
 */
const discordEmbedFor = (
  payload: WebhookPayload,
  brand: WebhookBrand = VALENCE_BRAND,
): DiscordEmbed => {
  const notice = webhookNoticeFor(payload, brand.name);
  const author = brand.name;
  const title = clipText(notice.title, TITLE_LIMIT);
  const footer = notice.footer === null ? null : clipText(notice.footer, FOOTER_LIMIT);
  const room = Math.min(
    DESCRIPTION_LIMIT,
    EMBED_LIMIT - title.length - author.length - (footer === null ? 0 : footer.length),
  );
  const description = noticeBodyOf(notice, discordMarkup, Math.max(room, 0));

  return {
    title,
    ...(description === '' ? {} : { description }),
    color: brand.accent !== null && EVERYDAY.has(notice.tone) ? brand.accent : COLOURS[notice.tone],
    author: brand.iconUrl === null ? { name: author } : { name: author, icon_url: brand.iconUrl },
    timestamp: payload.occurredAt,
    ...(footer === null ? {} : { footer: { text: footer } }),
    ...(notice.posterUrl === null ? {} : { thumbnail: { url: notice.posterUrl } }),
  };
};

export type { DiscordEmbed };

export { discordEmbedFor };
