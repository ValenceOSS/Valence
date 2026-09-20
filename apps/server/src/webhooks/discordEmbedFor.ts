import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeSpan } from './describeSpan';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import { MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';

const AUTHOR = 'Valence';

const COLOURS = {
  failure: 0xe8503a,
  auth: 0xe8a33a,
  arrival: 0x3ac47d,
  viewing: 0x3a8ee8,
  quiet: 0x8b5ce8,
} as const;

const TITLE_LIMIT = 256;

const DESCRIPTION_LIMIT = 4096;

const FIELD_NAME_LIMIT = 256;

const FIELD_VALUE_LIMIT = 1024;

const FIELDS_LIMIT = 25;

const EMBED_LIMIT = 6000;

const ELLIPSIS = '…';

type DiscordField = {
  name: string;
  value: string;
  inline: boolean;
};

type DiscordEmbed = {
  title: string;
  description: string;
  color: number;
  author: { name: string };
  timestamp: string;
  fields: DiscordField[];
  thumbnail?: { url: string };
};

/**
 * Cuts a string to what Discord will accept, marking that it was cut.
 *
 * Discord refuses the whole message when one field is over its limit, so this belongs in the code
 * rather than being discovered in production the first time somebody's film has a long title.
 *
 * @param text - What to say.
 * @param limit - The most Discord will take.
 * @returns The text, cut where it had to be.
 */
const clip = (text: string, limit: number): string =>
  text.length <= limit ? text : `${text.slice(0, limit - ELLIPSIS.length)}${ELLIPSIS}`;

/**
 * Says how far through something somebody got.
 *
 * @param positionSeconds - Where they stopped.
 * @param durationSeconds - How long it runs.
 * @returns The position, or null where nothing said.
 */
const progressOf = (
  positionSeconds: number | null,
  durationSeconds: number | null,
): string | null => {
  if (positionSeconds === null) {
    return null;
  }

  const minutes = Math.floor(positionSeconds / 60);
  const seconds = Math.floor(positionSeconds % 60)
    .toString()
    .padStart(2, '0');

  if (durationSeconds === null || durationSeconds === 0) {
    return `${minutes.toString()}:${seconds}`;
  }

  const through = Math.round((positionSeconds / durationSeconds) * 100);

  return `${minutes.toString()}:${seconds} (${through.toString()}%)`;
};

const GENRES_SHOWN = 4;

/**
 * Says what a catalogue thought of something, out of ten.
 *
 * @param rating - What it scored.
 * @returns The rating, or null where nothing scored it.
 */
const ratingOf = (rating: number | null): string | null =>
  rating === null || rating <= 0 ? null : `${rating.toFixed(1)}/10`;

type EmbedParts = {
  title: string;
  description: string;
  colour: number;
  fields: (DiscordField | null)[];
  posterUrl?: string | null;
};

/**
 * Decides what a Discord embed says about one event, before any of Discord's limits are applied.
 *
 * @param payload - What happened.
 * @param sentence - The plain rendering, used where an event has nothing richer to say.
 * @returns The parts of the embed.
 */
const partsFor = (payload: WebhookPayload, sentence: string): EmbedParts => {
  const field = (name: string, value: string | null, inline = true): DiscordField | null =>
    value === null || value === '' ? null : { name, value, inline };

  switch (payload.event) {
    case 'media.added':
    case 'media.removed': {
      const arriving = payload.event === 'media.added';

      const where = arriving
        ? `Arrived in ${payload.data.libraryName}`
        : `No longer in ${payload.data.libraryName}`;

      return {
        title: nameOfItem(payload.data),
        description: payload.data.overview ?? where,
        colour: arriving ? COLOURS.arrival : COLOURS.quiet,
        posterUrl: payload.data.posterUrl,
        fields: [
          field('Kind', MEDIA_KIND_LABELS[payload.data.kind]),
          field('Library', payload.data.libraryName),
          field('Runtime', describeSpan(payload.data.durationSeconds)),
          field('Quality', payload.data.quality),
          field('Rating', ratingOf(payload.data.rating)),
          field('Genres', payload.data.genres.slice(0, GENRES_SHOWN).join(', ')),
        ],
      };
    }

    case 'playback.started': {
      return {
        title: nameOfItem(payload.data.item),
        description: `${nameOfViewer(payload.data)} started watching`,
        colour: COLOURS.viewing,
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field('Device', payload.data.deviceLabel),
          field('Playing', payload.data.mode),
          field('Quality', payload.data.item.quality),
          field('Runtime', describeSpan(payload.data.item.durationSeconds)),
        ],
      };
    }

    case 'playback.stopped': {
      return {
        title: nameOfItem(payload.data.item),
        description: `${nameOfViewer(payload.data)} stopped watching`,
        colour: COLOURS.viewing,
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field('Device', payload.data.deviceLabel),
          field(
            'Stopped at',
            progressOf(payload.data.positionSeconds, payload.data.durationSeconds),
          ),
        ],
      };
    }

    case 'session.started': {
      return {
        title: `${nameOfViewer(payload.data)} opened Valence`,
        description: '',
        colour: COLOURS.viewing,
        fields: [
          field('Device', payload.data.deviceLabel),
          field('Account', payload.data.profileName === null ? null : payload.data.accountName),
          field('Guest of', payload.data.guestOf),
        ],
      };
    }

    case 'session.ended': {
      return {
        title: `${nameOfViewer(payload.data)} closed Valence`,
        description: '',
        colour: COLOURS.quiet,
        fields: [
          field('Device', payload.data.deviceLabel),
          field('Stayed', describeSpan(payload.data.lastedSeconds)),
        ],
      };
    }

    case 'auth.succeeded': {
      return {
        title: `${payload.data.name} signed in`,
        description: '',
        colour: COLOURS.auth,
        fields: [field('Device', payload.data.deviceLabel), field('Address', payload.data.address)],
      };
    }

    case 'auth.failed': {
      return {
        title: 'A sign-in was refused',
        description: payload.data.reason,
        colour: COLOURS.failure,
        fields: [
          field('Tried', payload.data.identifier),
          field('Device', payload.data.deviceLabel),
          field('Address', payload.data.address),
        ],
      };
    }

    case 'account.created': {
      return {
        title: `${payload.data.name} now has an account`,
        description: '',
        colour: COLOURS.arrival,
        fields: [],
      };
    }

    case 'account.deleted': {
      return {
        title: `${payload.data.name}'s account was deleted`,
        description: '',
        colour: COLOURS.failure,
        fields: [],
      };
    }

    case 'account.roleChanged': {
      return {
        title: `${payload.data.name}'s roles changed`,
        description: sentence,
        colour: COLOURS.auth,
        fields: [
          field('Role', payload.data.role),
          field('Change', payload.data.change === 'given' ? 'Given' : 'Taken away'),
        ],
      };
    }

    case 'library.scanned': {
      const { libraries, added, updated, removed, failed } = payload.data;
      const named = libraries.map((one) => one.libraryName);

      const described = libraries.map((one) => {
        const andMore =
          one.arrivedNotListed === 0 ? '' : `\n…and ${one.arrivedNotListed.toString()} more`;

        return one.arrived.length === 0
          ? null
          : `**${one.libraryName}**\n${one.arrived.join('\n')}${andMore}`;
      });

      return {
        title:
          libraries.length === 1
            ? `${named[0] ?? 'A library'} finished scanning`
            : `${libraries.length.toString()} libraries finished scanning`,
        description: described.filter((one) => one !== null).join('\n\n'),
        colour: added > 0 ? COLOURS.arrival : COLOURS.quiet,
        fields: [
          field('Libraries', libraries.length === 1 ? null : named.join(', '), false),
          field('Added', added.toString()),
          field('Updated', updated.toString()),
          field('Removed', removed.toString()),
          field('Unreadable', failed === 0 ? null : failed.toString()),
        ],
      };
    }

    case 'disk.low': {
      return {
        title: `${payload.data.mountPoint} is running out of room`,
        description: '',
        colour: COLOURS.failure,
        fields: [
          field('Free', formatBytes(payload.data.availableBytes)),
          field('Of', formatBytes(payload.data.totalBytes)),
        ],
      };
    }

    case 'disk.recovered': {
      return {
        title: `${payload.data.mountPoint} has room again`,
        description: '',
        colour: COLOURS.arrival,
        fields: [field('Free', formatBytes(payload.data.availableBytes))],
      };
    }

    case 'job.failed': {
      return {
        title: `${payload.data.label} failed`,
        description: payload.data.reason,
        colour: COLOURS.failure,
        fields: [field('Library', payload.data.subjectName)],
      };
    }

    case 'job.completed': {
      return {
        title: `${payload.data.label} finished`,
        description: '',
        colour: COLOURS.quiet,
        fields: [field('Library', payload.data.subjectName)],
      };
    }

    case 'job.stalled': {
      return {
        title: `${payload.data.label} keeps failing`,
        description: sentence,
        colour: COLOURS.failure,
        fields: [field('Attempts', payload.data.failures.toString())],
      };
    }

    case 'transcoder.unreachable':
    case 'requests.unreachable':
    case 'requests.vpnDown':
    case 'requests.indexerFailing':
    case 'requests.downloadFailed':
    case 'catalogue.unreachable': {
      return { title: sentence, description: '', colour: COLOURS.failure, fields: [] };
    }

    case 'job.working':
    case 'transcoder.reachable':
    case 'requests.reachable':
    case 'requests.vpnUp':
    case 'requests.indexerWorking':
    case 'requests.downloadStarted':
    case 'requests.made':
    case 'requests.approved':
    case 'requests.chosen':
    case 'requests.filed':
    case 'requests.available':
    case 'catalogue.reachable': {
      return { title: sentence, description: '', colour: COLOURS.arrival, fields: [] };
    }

    case 'requests.refused':
    case 'webhook.test': {
      return { title: sentence, description: '', colour: COLOURS.quiet, fields: [] };
    }
  }
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
 * @returns The embed.
 */
const discordEmbedFor = (payload: WebhookPayload, sentence: string): DiscordEmbed => {
  const parts = partsFor(payload, sentence);

  const fields = parts.fields
    .filter((one): one is DiscordField => one !== null)
    .slice(0, FIELDS_LIMIT)
    .map((one) => ({
      name: clip(one.name, FIELD_NAME_LIMIT),
      value: clip(one.value, FIELD_VALUE_LIMIT),
      inline: one.inline,
    }));

  const title = clip(parts.title, TITLE_LIMIT);
  const spentElsewhere =
    title.length +
    AUTHOR.length +
    fields.reduce((total, one) => total + one.name.length + one.value.length, 0);

  const description = clip(
    parts.description,
    Math.max(Math.min(DESCRIPTION_LIMIT, EMBED_LIMIT - spentElsewhere), 0),
  );

  return {
    title,
    description,
    color: parts.colour,
    author: { name: AUTHOR },
    timestamp: payload.occurredAt,
    fields,
    ...(parts.posterUrl === null || parts.posterUrl === undefined
      ? {}
      : { thumbnail: { url: parts.posterUrl } }),
  };
};

export type { DiscordEmbed };

export { discordEmbedFor };
