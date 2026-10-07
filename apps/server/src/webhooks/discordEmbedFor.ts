import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeArrival } from './describeArrival';
import { describeSpan } from './describeSpan';
import { isListenedTo } from './isListenedTo';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import { describeRequestState } from './describeRequestState';
import { MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { WebhookPayload, WebhookRequest } from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const AUTHOR = say('common.valence');

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
  author: { name: string; icon_url?: string };
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

const PLAYED: Record<PlaybackMode, () => string> = {
  DirectPlay: () => say('server.webhooks.discordEmbedFor.directPlay'),
  DirectStream: () => say('server.webhooks.discordEmbedFor.directStream'),
  Remux: () => say('common.remux'),
  Transcode: () => say('common.transcode'),
};

const REQUEST_KINDS: Record<MediaRequestKind, () => string> = {
  film: () => say('common.film'),
  series: () => say('common.series'),
  artist: () => say('common.artist'),
  album: () => say('common.album'),
  book: () => say('common.book'),
};

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
const field = (name: string, value: string | null, inline = true): DiscordField | null =>
  value === null || value === '' ? null : { name, value, inline };

type RequestEmbed = {
  headline:
    | 'server.webhooks.discordEmbedFor.kindRequestPendingApprovalTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestMadeTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestAutomaticallyApprovedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestApprovedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestDeclinedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestDownloadingTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestImportedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestNowAvailableTitle';
  colour: number;
  fields: (DiscordField | null)[];
};

/**
 * A request's event drawn as Seerr draws one: what happened to which request in the title, the
 * title's summary beneath, its poster beside, and who asked and where it has got to as fields.
 *
 * @param request - The request.
 * @param embed - What happened, its colour, and anything the event adds.
 * @returns The embed's parts.
 */
const requestPartsFor = (request: WebhookRequest, embed: RequestEmbed): EmbedParts => {
  const title =
    request.year === null
      ? request.title
      : say('screens.importWizard.importReportView.titleYear', {
          title: request.title,
          year: request.year.toString(),
        });

  return {
    title: say(embed.headline, { kind: REQUEST_KINDS[request.kind](), title }),
    description: request.overview ?? '',
    colour: embed.colour,
    posterUrl: request.posterUrl,
    fields: [
      field(say('screens.requests.describeRequestFilters.askedBy'), request.requestedBy),
      field(say('common.status'), describeRequestState(request.state)),
      field(
        say('screens.seasonChooser.seasons'),
        request.kind === 'series' && request.seasons !== null ? request.seasons.join(', ') : null,
      ),
      field(say('common.artist'), request.artistName),
      ...embed.fields,
    ],
  };
};

/**
 * How a request's event is drawn, where it carries the request.
 *
 * @param payload - The event.
 * @returns The embed's parts, or nothing for an event about no request.
 */
const requestEventPartsFor = (payload: WebhookPayload): EmbedParts | null => {
  if (payload.event === 'requests.made' && payload.data.request !== null) {
    const { request } = payload.data;
    const isWaiting = request.state === 'awaitingApproval';

    return requestPartsFor(request, {
      headline: isWaiting
        ? 'server.webhooks.discordEmbedFor.kindRequestPendingApprovalTitle'
        : 'server.webhooks.discordEmbedFor.kindRequestMadeTitle',
      colour: isWaiting ? COLOURS.auth : COLOURS.quiet,
      fields: [],
    });
  }

  if (payload.event === 'requests.approved' && payload.data.request !== null) {
    const { request, approvedBy } = payload.data;

    return requestPartsFor(request, {
      headline:
        approvedBy === null
          ? 'server.webhooks.discordEmbedFor.kindRequestAutomaticallyApprovedTitle'
          : 'server.webhooks.discordEmbedFor.kindRequestApprovedTitle',
      colour: COLOURS.quiet,
      fields: [field(say('server.webhooks.discordEmbedFor.approvedBy'), approvedBy)],
    });
  }

  if (payload.event === 'requests.refused' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestDeclinedTitle',
      colour: COLOURS.failure,
      fields: [field(say('server.webhooks.discordEmbedFor.reason'), payload.data.reason, false)],
    });
  }

  if (payload.event === 'requests.chosen' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestDownloadingTitle',
      colour: COLOURS.viewing,
      fields: [field(say('common.release'), payload.data.release, false)],
    });
  }

  if (payload.event === 'requests.filed' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestImportedTitle',
      colour: COLOURS.viewing,
      fields: [],
    });
  }

  if (payload.event === 'requests.available' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestNowAvailableTitle',
      colour: COLOURS.arrival,
      fields: [],
    });
  }

  return null;
};

const partsFor = (payload: WebhookPayload, sentence: string): EmbedParts => {
  switch (payload.event) {
    case 'media.added':
    case 'media.removed': {
      const arriving = payload.event === 'media.added';

      const where = arriving
        ? say('server.webhooks.discordEmbedFor.arrivedInLibraryName', {
            libraryName: payload.data.libraryName,
          })
        : say('server.webhooks.discordEmbedFor.noLongerInLibraryName', {
            libraryName: payload.data.libraryName,
          });

      return {
        title: nameOfItem(payload.data),
        description: payload.data.overview ?? where,
        colour: arriving ? COLOURS.arrival : COLOURS.quiet,
        posterUrl: payload.data.posterUrl,
        fields: [
          field(say('common.kind'), MEDIA_KIND_LABELS[payload.data.kind]),
          field(say('common.library'), payload.data.libraryName),
          field(
            say('server.webhooks.discordEmbedFor.runtime'),
            describeSpan(payload.data.durationSeconds),
          ),
          field(say('common.quality'), payload.data.quality),
          field(say('common.rating'), ratingOf(payload.data.rating)),
          field(
            say('server.webhooks.discordEmbedFor.genres'),
            payload.data.genres.slice(0, GENRES_SHOWN).join(', '),
          ),
        ],
      };
    }

    case 'playback.started': {
      return {
        title: nameOfItem(payload.data.item),
        description: say(
          isListenedTo(payload.data.item.kind)
            ? 'server.webhooks.discordEmbedFor.viewerStartedListening'
            : 'server.webhooks.discordEmbedFor.viewerStartedWatching',
          { viewer: nameOfViewer(payload.data) },
        ),
        colour: COLOURS.viewing,
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.playing'), PLAYED[payload.data.mode]()),
          field(say('common.quality'), payload.data.item.quality),
          field(
            say('server.webhooks.discordEmbedFor.runtime'),
            describeSpan(payload.data.item.durationSeconds),
          ),
        ],
      };
    }

    case 'playback.stopped': {
      return {
        title: nameOfItem(payload.data.item),
        description: say(
          isListenedTo(payload.data.item.kind)
            ? 'server.webhooks.discordEmbedFor.viewerStoppedListening'
            : 'server.webhooks.discordEmbedFor.viewerStoppedWatching',
          { viewer: nameOfViewer(payload.data) },
        ),
        colour: COLOURS.viewing,
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(
            say('server.webhooks.discordEmbedFor.stoppedAt'),
            progressOf(payload.data.positionSeconds, payload.data.durationSeconds),
          ),
        ],
      };
    }

    case 'session.started': {
      return {
        title: say('server.webhooks.discordEmbedFor.viewerOpenedValence', {
          viewer: nameOfViewer(payload.data),
        }),
        description: '',
        colour: COLOURS.viewing,
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('server.webhooks.discordEmbedFor.from'), payload.data.address),
          field(
            say('common.account'),
            payload.data.profileName === null ? null : payload.data.accountName,
          ),
          field(say('server.webhooks.discordEmbedFor.guestOf'), payload.data.guestOf),
        ],
      };
    }

    case 'session.ended': {
      return {
        title: say('server.webhooks.discordEmbedFor.viewerClosedValence', {
          viewer: nameOfViewer(payload.data),
        }),
        description: '',
        colour: COLOURS.quiet,
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(
            say('server.webhooks.discordEmbedFor.stayed'),
            describeSpan(payload.data.lastedSeconds),
          ),
        ],
      };
    }

    case 'plugin.event': {
      return {
        title: payload.data.title,
        description: say('common.fromPluginName', { pluginName: payload.data.pluginName }),
        colour: COLOURS.quiet,
        fields: Object.entries(payload.data.detail)
          .slice(0, 10)
          .map(([name, value]) => field(name, value === null ? null : String(value))),
      };
    }

    case 'auth.succeeded': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameSignedIn', { name: payload.data.name }),
        description: '',
        colour: COLOURS.auth,
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('server.webhooks.discordEmbedFor.from'), payload.data.address),
        ],
      };
    }

    case 'auth.failed': {
      return {
        title: say('server.webhooks.discordEmbedFor.aSignInWasRefused'),
        description: payload.data.reason,
        colour: COLOURS.failure,
        fields: [
          field(say('server.webhooks.discordEmbedFor.tried'), payload.data.identifier),
          field(say('common.device'), payload.data.deviceLabel),
          field(say('server.webhooks.discordEmbedFor.from'), payload.data.address),
        ],
      };
    }

    case 'account.created': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameNowHasAnAccount', {
          name: payload.data.name,
        }),
        description: '',
        colour: COLOURS.arrival,
        fields: [],
      };
    }

    case 'account.deleted': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameSAccountWasDeleted', {
          name: payload.data.name,
        }),
        description: '',
        colour: COLOURS.failure,
        fields: [],
      };
    }

    case 'account.roleChanged': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameSRolesChanged', {
          name: payload.data.name,
        }),
        description: sentence,
        colour: COLOURS.auth,
        fields: [
          field(say('common.role'), payload.data.role),
          field(
            say('common.change'),
            payload.data.change === 'given'
              ? say('server.webhooks.discordEmbedFor.given')
              : say('server.webhooks.discordEmbedFor.takenAway'),
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
            : `\n${say('server.webhooks.discordEmbedFor.andMore', { count: one.arrivedNotListed.toString() })}`;

        return one.arrived.length === 0
          ? null
          : `**${one.libraryName}**\n${one.arrived.map(describeArrival).join('\n')}${andMore}`;
      });

      return {
        title:
          libraries.length === 1
            ? say('server.webhooks.libraryFinishedScanning', {
                library: named[0] ?? say('common.aLibrary'),
              })
            : sayCount(
                'server.webhooks.discordEmbedFor.librariesFinishedScanning',
                libraries.length,
              ),
        description: described.filter((one) => one !== null).join('\n\n'),
        colour: added > 0 ? COLOURS.arrival : COLOURS.quiet,
        fields: [
          field(say('common.libraries'), libraries.length === 1 ? null : named.join(', '), false),
          field(say('common.added'), added.toString()),
          field(say('server.webhooks.discordEmbedFor.updated'), updated.toString()),
          field(say('server.webhooks.discordEmbedFor.removed'), removed.toString()),
          field(
            say('server.webhooks.discordEmbedFor.unreadable'),
            failed === 0 ? null : failed.toString(),
          ),
        ],
      };
    }

    case 'disk.low': {
      return {
        title: say('server.webhooks.discordEmbedFor.mountPointIsRunningOutOfRoom', {
          mountPoint: payload.data.mountPoint,
        }),
        description: '',
        colour: COLOURS.failure,
        fields: [
          field(
            say('server.webhooks.discordEmbedFor.free'),
            say('server.webhooks.discordEmbedFor.freeOfTotal', {
              free: formatBytes(payload.data.availableBytes),
              total: formatBytes(payload.data.totalBytes),
            }),
          ),
        ],
      };
    }

    case 'disk.recovered': {
      return {
        title: say('server.webhooks.discordEmbedFor.mountPointHasRoomAgain', {
          mountPoint: payload.data.mountPoint,
        }),
        description: '',
        colour: COLOURS.arrival,
        fields: [
          field(
            say('server.webhooks.discordEmbedFor.free'),
            formatBytes(payload.data.availableBytes),
          ),
        ],
      };
    }

    case 'job.failed': {
      return {
        title: say('server.webhooks.discordEmbedFor.labelFailed', { label: payload.data.label }),
        description: payload.data.reason,
        colour: COLOURS.failure,
        fields: [field(say('common.library'), payload.data.subjectName)],
      };
    }

    case 'job.completed': {
      return {
        title: say('server.webhooks.discordEmbedFor.labelFinished', { label: payload.data.label }),
        description: '',
        colour: COLOURS.quiet,
        fields: [field(say('common.library'), payload.data.subjectName)],
      };
    }

    case 'job.stalled': {
      return {
        title: say('server.webhooks.discordEmbedFor.labelKeepsFailing', {
          label: payload.data.label,
        }),
        description: sentence,
        colour: COLOURS.failure,
        fields: [
          field(say('server.webhooks.discordEmbedFor.attempts'), payload.data.failures.toString()),
        ],
      };
    }

    case 'requests.unreachable':
    case 'requests.vpnDown':
    case 'requests.indexerFailing': {
      return {
        title: sentence,
        description: '',
        colour: COLOURS.failure,
        fields: [
          field(say('server.webhooks.discordEmbedFor.howToFixIt'), payload.data.docs, false),
        ],
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
 * @param iconUrl - Where Discord can fetch Valence's mark to show beside its name, if anywhere.
 * @returns The embed.
 */
const discordEmbedFor = (
  payload: WebhookPayload,
  sentence: string,
  iconUrl: string | null = null,
): DiscordEmbed => {
  const parts = requestEventPartsFor(payload) ?? partsFor(payload, sentence);

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
    author: iconUrl === null ? { name: AUTHOR } : { name: AUTHOR, icon_url: iconUrl },
    timestamp: payload.occurredAt,
    fields,
    ...(parts.posterUrl === null ||
    parts.posterUrl === undefined ||
    !/^https?:\/\//.test(parts.posterUrl)
      ? {}
      : { thumbnail: { url: parts.posterUrl } }),
  };
};

export type { DiscordEmbed };

export { discordEmbedFor };
