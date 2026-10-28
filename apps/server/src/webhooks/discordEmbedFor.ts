import { clipText } from './clipText';
import { webhookNoticeFor } from './webhookNoticeFor';
import type { WebhookTone } from './webhookNoticeFor';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';

const AUTHOR = say('common.valence');

const COLOURS: Record<WebhookTone, number> = {
  failure: 0xe8503a,
  attention: 0xe8a33a,
  arrival: 0x3ac47d,
  viewing: 0x3a8ee8,
  quiet: 0x8b5ce8,
};

const TITLE_LIMIT = 256;

const DESCRIPTION_LIMIT = 4096;

const FIELD_NAME_LIMIT = 256;

const FIELD_VALUE_LIMIT = 1024;

const FIELDS_LIMIT = 25;

const EMBED_LIMIT = 6000;

type DiscordEmbed = {
  title: string;
  description: string;
  color: number;
  author: { name: string; icon_url?: string };
  timestamp: string;
  fields: { name: string; value: string; inline: boolean }[];
  thumbnail?: { url: string };
};

/**
 * Writes one event as a Discord embed: a title, a colour that says what kind of news it is, the
 * poster where there is one, and the details that deserve a label rather than a clause.
 *
 * Every one of Discord's limits is applied here rather than left to the receiver, because Discord
 * refuses the whole message when any one of them is exceeded — and a webhook that silently 400s
 * looks exactly like a webhook nothing has happened for.
 *
 * @param payload - What happened.
 * @param sentence - The plain rendering, for events with nothing richer to say.
 * @param iconUrl - Where Discord can fetch Valence's mark to show beside its name, if anywhere.
 * @returns The embed.
 */
const discordEmbedFor = (
  payload: WebhookPayload,
  sentence: string,
  iconUrl: string | null = null,
): DiscordEmbed => {
  const notice = webhookNoticeFor(payload, sentence);

  const fields = notice.fields.slice(0, FIELDS_LIMIT).map((one) => ({
    name: clipText(one.name, FIELD_NAME_LIMIT),
    value: clipText(one.value, FIELD_VALUE_LIMIT),
    inline: one.inline,
  }));

  const title = clipText(notice.title, TITLE_LIMIT);
  const spentElsewhere =
    title.length +
    AUTHOR.length +
    fields.reduce((total, one) => total + one.name.length + one.value.length, 0);

  const description = clipText(
    [notice.description, ...notice.sections.map((one) => `**${one.heading}**\n${one.body}`)]
      .filter((one) => one !== '')
      .join('\n\n'),
    Math.max(Math.min(DESCRIPTION_LIMIT, EMBED_LIMIT - spentElsewhere), 0),
  );

  return {
    title,
    description,
    color: COLOURS[notice.tone],
    author: iconUrl === null ? { name: AUTHOR } : { name: AUTHOR, icon_url: iconUrl },
    timestamp: payload.occurredAt,
    fields,
    ...(notice.posterUrl === null ? {} : { thumbnail: { url: notice.posterUrl } }),
  };
};

export type { DiscordEmbed };

export { discordEmbedFor };
