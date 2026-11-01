import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeArrival } from './describeArrival';
import { describeSpan } from './describeSpan';
import { isListenedTo } from './isListenedTo';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import { REQUEST_STATE_NAMES } from '@ValenceContracts/constants/REQUEST_STATE_NAMES';
import { MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type {
  WebhookEvent,
  WebhookPayload,
  WebhookRequest,
} from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';
import { nameOfAsker } from '@ValenceContracts/functions/nameOfAsker';
import { sayCount } from '@ValenceI18n/sayCount';

type WebhookTone = 'failure' | 'attention' | 'arrival' | 'viewing' | 'quiet';

type NoticeField = {
  name: string;
  value: string;
  inline: boolean;
};

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
  bookSeries: () => say('common.bookSeries'),
};

type NoticeSection = {
  heading: string;
  body: string;
};

type NoticeParts = {
  title: string;
  description: string;
  tone: WebhookTone;
  fields: (NoticeField | null)[];
  sections?: NoticeSection[];
  posterUrl?: string | null;
};

type WebhookNotice = {
  title: string;
  description: string;
  tone: WebhookTone;
  isUrgent: boolean;
  fields: NoticeField[];
  sections: NoticeSection[];
  posterUrl: string | null;
};

/**
 * A labelled detail, or nothing where there is nothing to say under the label.
 *
 * @param name - The label.
 * @param value - What it says, if anything.
 * @param inline - Whether it can sit beside others rather than taking a line of its own.
 * @returns The detail, or null.
 */
const field = (name: string, value: string | null, inline = true): NoticeField | null =>
  value === null || value === '' ? null : { name, value, inline };

type RequestNotice = {
  headline:
    | 'server.webhooks.discordEmbedFor.kindRequestPendingApprovalTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestMadeTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestAutomaticallyApprovedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestApprovedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestDeclinedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestDownloadingTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestImportedTitle'
    | 'server.webhooks.discordEmbedFor.kindRequestNowAvailableTitle';
  tone: WebhookTone;
  fields: (NoticeField | null)[];
};

/**
 * A request's event drawn as Seerr draws one: what happened to which request in the title, the
 * title's summary beneath, its poster beside, and who asked and where it has got to as fields.
 *
 * @param request - The request.
 * @param notice - What happened, its tone, and anything the event adds.
 * @returns The notice's parts.
 */
const requestPartsFor = (request: WebhookRequest, notice: RequestNotice): NoticeParts => {
  const title =
    request.year === null
      ? request.title
      : say('screens.importWizard.importReportView.titleYear', {
          title: request.title,
          year: request.year.toString(),
        });

  return {
    title: say(notice.headline, { kind: REQUEST_KINDS[request.kind](), title }),
    description: request.overview ?? '',
    tone: notice.tone,
    posterUrl: request.posterUrl,
    fields: [
      field(
        say('screens.requests.describeRequestFilters.askedBy'),
        nameOfAsker({ profileName: request.requestedByProfile, household: request.requestedBy }),
      ),
      field(say('common.status'), REQUEST_STATE_NAMES[request.state]),
      field(
        say('screens.seasonChooser.seasons'),
        request.kind === 'series' && request.seasons !== null ? request.seasons.join(', ') : null,
      ),
      field(say('common.artist'), request.artistName),
      ...notice.fields,
    ],
  };
};

/**
 * How a request's event is drawn, where it carries the request.
 *
 * @param payload - The event.
 * @returns The notice's parts, or nothing for an event about no request.
 */
const requestEventPartsFor = (payload: WebhookPayload): NoticeParts | null => {
  if (payload.event === 'requests.made' && payload.data.request !== null) {
    const { request } = payload.data;
    const isWaiting = request.state === 'awaitingApproval';

    return requestPartsFor(request, {
      headline: isWaiting
        ? 'server.webhooks.discordEmbedFor.kindRequestPendingApprovalTitle'
        : 'server.webhooks.discordEmbedFor.kindRequestMadeTitle',
      tone: isWaiting ? 'attention' : 'quiet',
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
      tone: 'quiet',
      fields: [field(say('server.webhooks.discordEmbedFor.approvedBy'), approvedBy)],
    });
  }

  if (payload.event === 'requests.refused' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestDeclinedTitle',
      tone: 'failure',
      fields: [field(say('server.webhooks.discordEmbedFor.reason'), payload.data.reason, false)],
    });
  }

  if (payload.event === 'requests.chosen' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestDownloadingTitle',
      tone: 'viewing',
      fields: [field(say('common.release'), payload.data.release, false)],
    });
  }

  if (payload.event === 'requests.filed' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestImportedTitle',
      tone: 'viewing',
      fields: [],
    });
  }

  if (payload.event === 'requests.available' && payload.data.request !== null) {
    return requestPartsFor(payload.data.request, {
      headline: 'server.webhooks.discordEmbedFor.kindRequestNowAvailableTitle',
      tone: 'arrival',
      fields: [],
    });
  }

  return null;
};

const partsFor = (payload: WebhookPayload, sentence: string): NoticeParts => {
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
        tone: arriving ? 'arrival' : 'quiet',
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
        tone: 'viewing',
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.browserOrApp'), payload.data.clientLabel),
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
        tone: 'viewing',
        posterUrl: payload.data.item.posterUrl,
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.browserOrApp'), payload.data.clientLabel),
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
        tone: 'viewing',
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.browserOrApp'), payload.data.clientLabel),
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
        tone: 'quiet',
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.browserOrApp'), payload.data.clientLabel),
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
        tone: 'quiet',
        fields: Object.entries(payload.data.detail)
          .slice(0, 10)
          .map(([name, value]) => field(name, value === null ? null : String(value))),
      };
    }

    case 'auth.succeeded': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameSignedIn', { name: payload.data.name }),
        description: '',
        tone: 'attention',
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.browserOrApp'), payload.data.clientLabel),
          field(say('server.webhooks.discordEmbedFor.from'), payload.data.address),
        ],
      };
    }

    case 'profile.chosen': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameIsWatching', {
          name: nameOfAsker({
            profileName: payload.data.profileName,
            household: payload.data.accountName,
          }),
        }),
        description: '',
        tone: 'attention',
        fields: [
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.browserOrApp'), payload.data.clientLabel),
          field(say('server.webhooks.discordEmbedFor.from'), payload.data.address),
        ],
      };
    }

    case 'auth.failed': {
      return {
        title: say('server.webhooks.discordEmbedFor.aSignInWasRefused'),
        description: payload.data.reason,
        tone: 'failure',
        fields: [
          field(say('server.webhooks.discordEmbedFor.tried'), payload.data.identifier),
          field(say('common.device'), payload.data.deviceLabel),
          field(say('common.browserOrApp'), payload.data.clientLabel),
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
        tone: 'arrival',
        fields: [],
      };
    }

    case 'account.deleted': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameSAccountWasDeleted', {
          name: payload.data.name,
        }),
        description: '',
        tone: 'failure',
        fields: [],
      };
    }

    case 'account.roleChanged': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameSRolesChanged', {
          name: payload.data.name,
        }),
        description: sentence,
        tone: 'attention',
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

      const sections = libraries.flatMap((one) => {
        const andMore =
          one.arrivedNotListed === 0
            ? []
            : [
                say('server.webhooks.discordEmbedFor.andMore', {
                  count: one.arrivedNotListed.toString(),
                }),
              ];

        return one.arrived.length === 0
          ? []
          : [
              {
                heading: one.libraryName,
                body: [...one.arrived.map(describeArrival), ...andMore].join('\n'),
              },
            ];
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
        description: '',
        sections,
        tone: added > 0 ? 'arrival' : 'quiet',
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
        tone: 'failure',
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
        tone: 'arrival',
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
        tone: 'failure',
        fields: [field(say('common.library'), payload.data.subjectName)],
      };
    }

    case 'job.completed': {
      return {
        title: say('server.webhooks.discordEmbedFor.labelFinished', { label: payload.data.label }),
        description: '',
        tone: 'quiet',
        fields: [field(say('common.library'), payload.data.subjectName)],
      };
    }

    case 'job.stalled': {
      return {
        title: say('server.webhooks.discordEmbedFor.labelKeepsFailing', {
          label: payload.data.label,
        }),
        description: sentence,
        tone: 'failure',
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
        tone: 'failure',
        fields: [
          field(say('server.webhooks.discordEmbedFor.howToFixIt'), payload.data.docs, false),
        ],
      };
    }

    case 'transcoder.unreachable':
    case 'requests.downloadFailed':
    case 'catalogue.unreachable': {
      return { title: sentence, description: '', tone: 'failure', fields: [] };
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
      return { title: sentence, description: '', tone: 'arrival', fields: [] };
    }

    case 'requests.refused':
    case 'webhook.test': {
      return { title: sentence, description: '', tone: 'quiet', fields: [] };
    }
  }
};

const URGENT_EVENTS: ReadonlySet<WebhookEvent> = new Set([
  'job.failed',
  'job.stalled',
  'catalogue.unreachable',
  'transcoder.unreachable',
  'disk.low',
  'requests.unreachable',
  'requests.vpnDown',
  'requests.indexerFailing',
  'requests.downloadFailed',
]);

/**
 * Decides what any receiver is told about one event — a title, a summary, labelled details, the
 * poster where there is one, and whether it is news or a problem somebody has to put right — before
 * any receiver's own shape or limits are applied.
 *
 * @param payload - What happened.
 * @param sentence - The plain rendering, used where an event has nothing richer to say.
 * @returns The notice.
 */
const webhookNoticeFor = (payload: WebhookPayload, sentence: string): WebhookNotice => {
  const parts = requestEventPartsFor(payload) ?? partsFor(payload, sentence);
  const posterUrl = parts.posterUrl ?? null;

  return {
    title: parts.title,
    description: parts.description,
    tone: parts.tone,
    isUrgent: URGENT_EVENTS.has(payload.event),
    fields: parts.fields.filter((one): one is NoticeField => one !== null),
    sections: parts.sections ?? [],
    posterUrl: posterUrl !== null && /^https?:\/\//.test(posterUrl) ? posterUrl : null,
  };
};

export { webhookNoticeFor };

export type { NoticeField, NoticeSection, WebhookNotice, WebhookTone };
