import { sayCount } from '@ValenceI18n/sayCount';
import { say } from '@ValenceI18n/say';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeArrival } from './describeArrival';
import { describeSpan } from './describeSpan';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import { MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';

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

      const where = say(arriving ? 'server.discord.arrivedIn' : 'server.discord.noLongerIn', {
        library: payload.data.libraryName,
      });

      return {
        title: nameOfItem(payload.data),
        description: payload.data.overview ?? where,
        colour: arriving ? COLOURS.arrival : COLOURS.quiet,
        posterUrl: payload.data.posterUrl,
        fields: [
          field(say('server.discord.kind'), MEDIA_KIND_LABELS[payload.data.kind]),
          field(say('server.discord.library'), payload.data.libraryName),
          field(say('server.discord.runtime'), describeSpan(payload.data.durationSeconds)),
          field(say('server.discord.quality'), payload.data.quality),
          field(say('server.discord.rating'), ratingOf(payload.data.rating)),
          field(
            say('server.discord.genres'),
            payload.data.genres.slice(0, GENRES_SHOWN).join(', '),
          ),
        ],
      };
    }

    case 'playback.started': {
      return {
        title: nameOfItem(payload.data.item),
        description: say('server.discord.startedWatching', { viewer: nameOfViewer(payload.data) }),
        colour: COLOURS.viewing,
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field(say('server.discord.device'), payload.data.deviceLabel),
          field(say('server.discord.playing'), payload.data.mode),
          field(say('server.discord.quality'), payload.data.item.quality),
          field(say('server.discord.runtime'), describeSpan(payload.data.item.durationSeconds)),
        ],
      };
    }

    case 'playback.stopped': {
      return {
        title: nameOfItem(payload.data.item),
        description: say('server.discord.stoppedWatching', { viewer: nameOfViewer(payload.data) }),
        colour: COLOURS.viewing,
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field(say('server.discord.device'), payload.data.deviceLabel),
          field(
            say('server.discord.stoppedAt'),
            progressOf(payload.data.positionSeconds, payload.data.durationSeconds),
          ),
        ],
      };
    }

    case 'session.started': {
      return {
        title: say('server.discord.opened', { viewer: nameOfViewer(payload.data) }),
        description: '',
        colour: COLOURS.viewing,
        fields: [
          field(say('server.discord.device'), payload.data.deviceLabel),
          field(say('server.discord.from'), payload.data.address),
          field(
            say('server.discord.account'),
            payload.data.profileName === null ? null : payload.data.accountName,
          ),
          field(say('server.discord.guestOf'), payload.data.guestOf),
        ],
      };
    }

    case 'session.ended': {
      return {
        title: say('server.discord.closed', { viewer: nameOfViewer(payload.data) }),
        description: '',
        colour: COLOURS.quiet,
        fields: [
          field(say('server.discord.device'), payload.data.deviceLabel),
          field(say('server.discord.stayed'), describeSpan(payload.data.lastedSeconds)),
        ],
      };
    }

    case 'auth.succeeded': {
      return {
        title: say('server.discord.signedIn', { name: payload.data.name }),
        description: '',
        colour: COLOURS.auth,
        fields: [
          field(say('server.discord.device'), payload.data.deviceLabel),
          field(say('server.discord.from'), payload.data.address),
        ],
      };
    }

    case 'auth.failed': {
      return {
        title: say('server.discord.signInRefused'),
        description: payload.data.reason,
        colour: COLOURS.failure,
        fields: [
          field(say('server.discord.tried'), payload.data.identifier),
          field(say('server.discord.device'), payload.data.deviceLabel),
          field(say('server.discord.from'), payload.data.address),
        ],
      };
    }

    case 'account.created': {
      return {
        title: say('server.discord.accountCreated', { name: payload.data.name }),
        description: '',
        colour: COLOURS.arrival,
        fields: [],
      };
    }

    case 'account.deleted': {
      return {
        title: say('server.discord.accountDeleted', { name: payload.data.name }),
        description: '',
        colour: COLOURS.failure,
        fields: [],
      };
    }

    case 'account.roleChanged': {
      return {
        title: say('server.discord.rolesChanged', { name: payload.data.name }),
        description: sentence,
        colour: COLOURS.auth,
        fields: [
          field(say('server.discord.role'), payload.data.role),
          field(
            say('server.discord.change'),
            payload.data.change === 'given'
              ? say('server.discord.given')
              : say('server.discord.takenAway'),
          ),
        ],
      };
    }

    case 'library.scanned': {
      const { libraries, added, updated, removed, failed } = payload.data;
      const named = libraries.map((one) => one.libraryName);

      const described = libraries.map((one) => {
        const andMore =
          one.arrivedNotListed === 0
            ? ''
            : `\n${say('server.discord.andMore', { count: one.arrivedNotListed.toString() })}`;

        return one.arrived.length === 0
          ? null
          : `**${one.libraryName}**\n${one.arrived.map(describeArrival).join('\n')}${andMore}`;
      });

      return {
        title:
          libraries.length === 1
            ? say('server.discord.libraryScanned', {
                library: named[0] ?? say('server.defaults.aLibrary'),
              })
            : sayCount('server.discord.librariesScanned', libraries.length),
        description: described.filter((one) => one !== null).join('\n\n'),
        colour: added > 0 ? COLOURS.arrival : COLOURS.quiet,
        fields: [
          field(
            say('server.discord.libraries'),
            libraries.length === 1 ? null : named.join(', '),
            false,
          ),
          field(say('server.discord.added'), added.toString()),
          field(say('server.discord.updated'), updated.toString()),
          field(say('server.discord.removed'), removed.toString()),
          field(say('server.discord.unreadable'), failed === 0 ? null : failed.toString()),
        ],
      };
    }

    case 'disk.low': {
      return {
        title: say('server.discord.diskLow', { disk: payload.data.mountPoint }),
        description: '',
        colour: COLOURS.failure,
        fields: [
          field(say('server.discord.free'), formatBytes(payload.data.availableBytes)),
          field(say('server.discord.of'), formatBytes(payload.data.totalBytes)),
        ],
      };
    }

    case 'disk.recovered': {
      return {
        title: say('server.discord.diskRecovered', { disk: payload.data.mountPoint }),
        description: '',
        colour: COLOURS.arrival,
        fields: [field(say('server.discord.free'), formatBytes(payload.data.availableBytes))],
      };
    }

    case 'job.failed': {
      return {
        title: say('server.discord.jobFailed', { label: payload.data.label }),
        description: payload.data.reason,
        colour: COLOURS.failure,
        fields: [field(say('server.discord.library'), payload.data.subjectName)],
      };
    }

    case 'job.completed': {
      return {
        title: say('server.discord.jobFinished', { label: payload.data.label }),
        description: '',
        colour: COLOURS.quiet,
        fields: [field(say('server.discord.library'), payload.data.subjectName)],
      };
    }

    case 'job.stalled': {
      return {
        title: say('server.discord.jobStalled', { label: payload.data.label }),
        description: sentence,
        colour: COLOURS.failure,
        fields: [field(say('server.discord.attempts'), payload.data.failures.toString())],
      };
    }

    case 'requests.unreachable':
    case 'requests.vpnDown':
    case 'requests.indexerFailing': {
      return {
        title: sentence,
        description: '',
        colour: COLOURS.failure,
        fields: [field(say('server.discord.howToFix'), payload.data.docs, false)],
      };
    }

    case 'transcoder.unreachable':
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
    say('common.valence').length +
    fields.reduce((total, one) => total + one.name.length + one.value.length, 0);

  const description = clip(
    parts.description,
    Math.max(Math.min(DESCRIPTION_LIMIT, EMBED_LIMIT - spentElsewhere), 0),
  );

  return {
    title,
    description,
    color: parts.colour,
    author: { name: say('common.valence') },
    timestamp: payload.occurredAt,
    fields,
    ...(parts.posterUrl === null || parts.posterUrl === undefined
      ? {}
      : { thumbnail: { url: parts.posterUrl } }),
  };
};

export type { DiscordEmbed };

export { discordEmbedFor };
