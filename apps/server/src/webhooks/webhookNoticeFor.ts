import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { clipText } from './clipText';
import { describeSeasons } from './describeSeasons';
import { describeSpan } from './describeSpan';
import { isListenedTo } from './isListenedTo';
import { nameOfItem } from './nameOfItem';
import { nameOfViewer } from './nameOfViewer';
import { REQUEST_STATE_NAMES } from '@ValenceContracts/constants/REQUEST_STATE_NAMES';
import { MEDIA_KIND_LABELS } from '@ValenceContracts/schemas/MediaKind';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type {
  ArrivedTitle,
  WebhookEvent,
  WebhookPayload,
  WebhookRequest,
} from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { sayParts } from '@ValenceI18n/sayParts';
import type { StringKey } from '@ValenceI18n/StringKey';
import { nameOfAsker } from '@ValenceContracts/functions/nameOfAsker';

type WebhookTone = 'failure' | 'attention' | 'arrival' | 'viewing' | 'quiet';

type NoticeWords = readonly (string | { strong: string })[];

type NoticeDetail = { label: string | null; text: string; look: 'quote' | 'code' };

type NoticeLink = { label: string; url: string };

type NoticeSection = { heading: string; lines: string[] };

type WebhookNotice = {
  title: string;
  lead: NoticeWords;
  context: string[];
  body: string;
  tags: string[];
  details: NoticeDetail[];
  sections: NoticeSection[];
  link: NoticeLink | null;
  footer: string | null;
  tone: WebhookTone;
  isUrgent: boolean;
  posterUrl: string | null;
};

type NoticeParts = Pick<WebhookNotice, 'title' | 'tone'> &
  Partial<Omit<WebhookNotice, 'title' | 'tone' | 'isUrgent'>>;

type RequestEvent = Extract<
  WebhookPayload,
  {
    event:
      | 'requests.made'
      | 'requests.approved'
      | 'requests.refused'
      | 'requests.chosen'
      | 'requests.filed'
      | 'requests.available';
  }
>;

type ServerEvent = Extract<
  WebhookPayload,
  {
    event:
      | 'webhook.test'
      | 'job.completed'
      | 'job.failed'
      | 'job.stalled'
      | 'job.working'
      | 'library.scanned'
      | 'catalogue.unreachable'
      | 'catalogue.reachable'
      | 'transcoder.unreachable'
      | 'transcoder.reachable'
      | 'disk.low'
      | 'disk.recovered';
  }
>;

type RequestsServiceEvent = Extract<
  WebhookPayload,
  {
    event:
      | 'requests.unreachable'
      | 'requests.reachable'
      | 'requests.vpnDown'
      | 'requests.vpnUp'
      | 'requests.indexerFailing'
      | 'requests.indexerWorking'
      | 'requests.downloadStarted'
      | 'requests.downloadFailed';
  }
>;

type PeopleEvent = Extract<
  WebhookPayload,
  {
    event:
      | 'auth.succeeded'
      | 'auth.failed'
      | 'profile.chosen'
      | 'account.created'
      | 'account.deleted'
      | 'account.roleChanged'
      | 'session.started'
      | 'session.ended';
  }
>;

const GENRES_SHOWN = 4;

const PLUGIN_DETAILS_SHOWN = 10;

const TAG_LIMIT = 80;

const PLAYED: Record<PlaybackMode, () => string> = {
  DirectPlay: () => say('server.webhooks.discordEmbedFor.directPlay'),
  DirectStream: () => say('server.webhooks.discordEmbedFor.directStream'),
  Remux: () => say('common.remux'),
  Transcode: () => say('common.transcode'),
};

const REQUESTED: Record<MediaRequestKind, StringKey> = {
  film: 'server.webhooks.notice.requestedFilm',
  series: 'server.webhooks.notice.requestedSeries',
  artist: 'server.webhooks.notice.requestedArtist',
  album: 'server.webhooks.notice.requestedAlbum',
  book: 'server.webhooks.notice.requestedBook',
  bookSeries: 'server.webhooks.notice.requestedBookSeries',
};

const READY: Record<MediaRequestKind, StringKey> = {
  film: 'server.webhooks.notice.readyToWatch',
  series: 'server.webhooks.notice.readyToWatch',
  artist: 'server.webhooks.notice.readyToListen',
  album: 'server.webhooks.notice.readyToListen',
  book: 'server.webhooks.notice.readyToRead',
  bookSeries: 'server.webhooks.notice.readyToRead',
};

/**
 * A name or a thing a notice's sentence is about, set apart from the words around it.
 *
 * @param text - The name.
 * @returns It, marked to be set apart.
 */
const strong = (text: string): { strong: string } => ({ strong: text });

/**
 * One of the strings file's sentences with its gaps filled, some of them set apart.
 *
 * @param key - The sentence.
 * @param fillings - What goes in each gap.
 * @returns The sentence, in parts.
 */
const words = (
  key: StringKey,
  fillings: Readonly<Record<string, string | { strong: string }>>,
): NoticeWords => sayParts(key, fillings);

/**
 * Where a device was, on the small line under a notice: the device, what it reaches Valence
 * through, and the address it came from.
 *
 * @param where - The device, its client, and its address where each is known.
 * @returns The parts of the line.
 */
const placesOf = (where: {
  deviceLabel: string;
  clientLabel: string | null;
  address?: string | null;
}): string[] => [
  where.deviceLabel,
  ...(where.clientLabel === null ? [] : [where.clientLabel]),
  ...(where.address === null || where.address === undefined
    ? []
    : [say('server.webhooks.notice.fromAddress', { address: where.address })]),
];

/**
 * Says where somebody stopped, as a time.
 *
 * @param positionSeconds - Where they stopped.
 * @returns The position.
 */
const positionOf = (positionSeconds: number): string => {
  const hours = Math.floor(positionSeconds / 3600);
  const minutes = Math.floor((positionSeconds % 3600) / 60);
  const seconds = Math.floor(positionSeconds % 60)
    .toString()
    .padStart(2, '0');

  return hours === 0
    ? `${minutes.toString()}:${seconds}`
    : `${hours.toString()}:${minutes.toString().padStart(2, '0')}:${seconds}`;
};

/**
 * A title with its year, the way a request names it.
 *
 * @param request - The request.
 * @returns The title.
 */
const titleOfRequest = (request: WebhookRequest): string =>
  request.year === null
    ? request.title
    : say('screens.importWizard.importReportView.titleYear', {
        title: request.title,
        year: request.year.toString(),
      });

/**
 * Who asked for a request, as a notice names them.
 *
 * @param request - The request.
 * @returns Who asked.
 */
const askerOf = (request: WebhookRequest): { strong: string } =>
  strong(nameOfAsker({ profileName: request.requestedByProfile, household: request.requestedBy }));

/**
 * What a request is for, on the small line: which seasons of a series, or whose album.
 *
 * @param request - The request.
 * @returns The line's parts.
 */
const requestContextOf = (request: WebhookRequest): string[] => {
  const seasons =
    request.kind === 'series' && request.seasons !== null ? describeSeasons(request.seasons) : null;

  return [
    ...(seasons === null ? [] : [seasons]),
    ...(request.artistName === null
      ? []
      : [say('server.webhooks.notice.byArtist', { artist: request.artistName })]),
  ];
};

/**
 * A request's event: the title it is for and its poster, who did what to it, which seasons or whose
 * album, and what the event adds. The title's summary is told when it is asked for and when it
 * arrives, and not at every step between.
 *
 * @param request - The request.
 * @param event - What happened, its tone, and anything the event adds.
 * @returns The notice's parts.
 */
const requestParts = (
  request: WebhookRequest,
  event: Pick<NoticeParts, 'lead' | 'tone' | 'details' | 'tags'> & { tellsTheStory?: boolean },
): NoticeParts => ({
  title: titleOfRequest(request),
  lead: event.lead ?? [],
  context: requestContextOf(request),
  body: event.tellsTheStory === true ? (request.overview ?? '') : '',
  tags: event.tags ?? [],
  details: event.details ?? [],
  tone: event.tone,
  posterUrl: request.posterUrl,
  footer: say('common.requests'),
});

/**
 * A request's event where it carries its request.
 *
 * @param payload - The event.
 * @returns The notice's parts, or nothing for an event about no request.
 */
const requestEventParts = (payload: RequestEvent): NoticeParts | null => {
  if (payload.event === 'requests.made' && payload.data.request !== null) {
    const { request } = payload.data;
    const isWaiting = request.state === 'awaitingApproval';

    return requestParts(request, {
      lead: words(REQUESTED[request.kind], { asker: askerOf(request) }),
      tags: isWaiting ? [REQUEST_STATE_NAMES.awaitingApproval] : [],
      tone: isWaiting ? 'attention' : 'quiet',
      tellsTheStory: true,
    });
  }

  if (payload.event === 'requests.approved' && payload.data.request !== null) {
    const { request, approvedBy } = payload.data;
    const asker = askerOf(request);

    return requestParts(request, {
      lead:
        approvedBy === null
          ? words('server.webhooks.notice.approvedAutomatically', { asker })
          : words('server.webhooks.notice.approvedRequest', {
              approver: strong(approvedBy),
              asker,
            }),
      tone: 'quiet',
    });
  }

  if (payload.event === 'requests.refused' && payload.data.request !== null) {
    const { request, reason } = payload.data;

    return requestParts(request, {
      lead: words('server.webhooks.notice.requestDeclined', { asker: askerOf(request) }),
      details:
        reason === null
          ? []
          : [{ label: say('server.webhooks.discordEmbedFor.reason'), text: reason, look: 'quote' }],
      tone: 'failure',
    });
  }

  if (payload.event === 'requests.chosen' && payload.data.request !== null) {
    const { request, release } = payload.data;

    return requestParts(request, {
      lead: words('server.webhooks.notice.foundARelease', { asker: askerOf(request) }),
      details: [{ label: say('common.release'), text: release, look: 'code' }],
      tone: 'viewing',
    });
  }

  if (payload.event === 'requests.filed' && payload.data.request !== null) {
    const { request } = payload.data;

    return requestParts(request, {
      lead: words('server.webhooks.notice.inTheLibrary', { asker: askerOf(request) }),
      tone: 'viewing',
    });
  }

  if (payload.event === 'requests.available' && payload.data.request !== null) {
    const { request } = payload.data;

    return requestParts(request, {
      lead: words(READY[request.kind], { asker: askerOf(request) }),
      tone: 'arrival',
      tellsTheStory: true,
    });
  }

  return null;
};

/**
 * A title that arrived in a library scan, and how many of its episodes where there were several.
 *
 * @param arrival - The title.
 * @returns How it is listed.
 */
const arrivalOf = (arrival: ArrivedTitle): string =>
  arrival.episodes <= 1
    ? arrival.title
    : sayCount('server.webhooks.notice.titleEpisodes', arrival.episodes, {
        title: arrival.title,
      });

/**
 * A detail a plugin sent with its event, as a tag: a number before what it counts, anything else
 * after its name.
 *
 * @param name - What the plugin called the detail.
 * @param value - Its value.
 * @returns The tag, or nothing for a detail with no value.
 */
const pluginTagOf = (name: string, value: string | number | boolean | null): string | null => {
  if (value === null) {
    return null;
  }

  return typeof value === 'number'
    ? say('server.webhooks.notice.pluginCount', { count: value.toString(), name })
    : say('server.webhooks.notice.pluginDetail', { name, value: String(value) });
};

/**
 * A service or job coming back: the title, what it does again, and that nobody need do anything.
 *
 * @param title - What came back.
 * @param lead - What it does again.
 * @param footer - Which part of Valence it belongs to.
 * @returns The notice's parts.
 */
const backAgain = (title: string, lead: NoticeWords, footer: string): NoticeParts => ({
  title,
  lead,
  context: [say('server.webhooks.notice.noActionNeeded')],
  tone: 'arrival',
  footer,
});

/**
 * A problem, quoted, with how to put it right where Valence's documentation says.
 *
 * @param problem - What went wrong.
 * @param docs - Where the documentation explains it, where it does.
 * @returns The details and the link.
 */
const problemOf = (
  problem: string,
  docs: string | null = null,
): Pick<NoticeParts, 'details' | 'link'> => ({
  details: [{ label: null, text: problem, look: 'quote' }],
  link:
    docs === null ? null : { label: say('server.webhooks.discordEmbedFor.howToFixIt'), url: docs },
});

/**
 * A request's event from a requests service too old to send the request with it: only what the
 * event itself carries.
 *
 * @param payload - The event.
 * @returns The notice's parts.
 */
const bareRequestParts = (payload: RequestEvent): NoticeParts => {
  const footer = say('common.requests');

  switch (payload.event) {
    case 'requests.made': {
      return {
        title: payload.data.title,
        lead: words(REQUESTED[payload.data.kind], {
          asker: strong(
            nameOfAsker({
              profileName: payload.data.profileName,
              household: payload.data.requestedBy,
            }),
          ),
        }),
        tone: 'quiet',
        footer,
      };
    }

    case 'requests.approved': {
      const { approvedBy } = payload.data;

      return {
        title: payload.data.title,
        lead:
          approvedBy === null
            ? [say('server.webhooks.notice.approvedItAutomatically')]
            : words('server.webhooks.notice.approverApprovedIt', { approver: strong(approvedBy) }),
        tone: 'quiet',
        footer,
      };
    }

    case 'requests.refused': {
      return {
        title: payload.data.title,
        lead: [say('server.webhooks.notice.itWasDeclined')],
        details:
          payload.data.reason === null
            ? []
            : [
                {
                  label: say('server.webhooks.discordEmbedFor.reason'),
                  text: payload.data.reason,
                  look: 'quote',
                },
              ],
        tone: 'failure',
        footer,
      };
    }

    case 'requests.chosen': {
      return {
        title: payload.data.title,
        lead: [say('server.webhooks.notice.foundAReleaseForIt')],
        details: [{ label: say('common.release'), text: payload.data.release, look: 'code' }],
        tone: 'viewing',
        footer,
      };
    }

    case 'requests.filed': {
      return {
        title: payload.data.title,
        lead: [say('server.webhooks.notice.nowInTheLibrary')],
        tone: 'viewing',
        footer,
      };
    }

    case 'requests.available': {
      return {
        title: payload.data.title,
        lead: words('server.webhooks.notice.readyToWatch', {
          asker: strong(
            nameOfAsker({
              profileName: payload.data.profileName,
              household: payload.data.requestedBy,
            }),
          ),
        }),
        tone: 'arrival',
        footer,
      };
    }
  }
};

/**
 * What a library scan found: how many titles arrived, changed and went, and what arrived in each
 * library.
 *
 * @param data - The scan.
 * @returns The notice's parts.
 */
const scanParts = (
  data: Extract<WebhookPayload, { event: 'library.scanned' }>['data'],
): NoticeParts => {
  const { libraries, added, updated, removed, failed } = data;
  const [only] = libraries;

  return {
    title:
      libraries.length === 1 && only !== undefined
        ? say('server.webhooks.notice.libraryScanned', { library: only.libraryName })
        : sayCount('server.webhooks.notice.librariesScanned', libraries.length),
    context: libraries.length === 1 ? [] : libraries.map((one) => one.libraryName),
    tags: [
      sayCount('server.jobs.phase.arrived', added),
      sayCount('common.count.updated', updated),
      sayCount('common.count.removed', removed),
      ...(failed === 0 ? [] : [sayCount('common.count.unreadable', failed)]),
    ],
    sections: libraries.flatMap((one) =>
      one.arrived.length === 0
        ? []
        : [
            {
              heading: sayCount('server.webhooks.notice.libraryAdded', one.added, {
                library: one.libraryName,
              }),
              lines: [
                ...one.arrived.map(arrivalOf),
                ...(one.arrivedNotListed === 0
                  ? []
                  : [
                      say('server.webhooks.discordEmbedFor.andMore', {
                        count: one.arrivedNotListed.toString(),
                      }),
                    ]),
              ],
            },
          ],
    ),
    tone: added > 0 ? 'arrival' : 'quiet',
    footer: say('common.libraries'),
  };
};

/**
 * What somebody watching or listening is doing, for a playback event.
 *
 * @param payload - The event.
 * @returns The notice's parts.
 */
const playbackParts = (
  payload: Extract<WebhookPayload, { event: 'playback.started' | 'playback.stopped' }>,
): NoticeParts => {
  const { item } = payload.data;
  const isListening = isListenedTo(item.kind);
  const viewer = strong(nameOfViewer(payload.data));
  const shared = {
    title: nameOfItem(item),
    context: placesOf(payload.data),
    tone: 'viewing' as const,
    posterUrl: item.posterUrl,
    footer: item.libraryName,
  };

  if (payload.event === 'playback.started') {
    const runtime = describeSpan(item.durationSeconds);

    return {
      ...shared,
      lead: words(
        isListening
          ? 'server.webhooks.discordEmbedFor.viewerStartedListening'
          : 'server.webhooks.discordEmbedFor.viewerStartedWatching',
        { viewer },
      ),
      tags: [
        PLAYED[payload.data.mode](),
        ...(item.quality === null ? [] : [item.quality]),
        ...(runtime === null ? [] : [runtime]),
      ],
    };
  }

  const { positionSeconds, durationSeconds } = payload.data;
  const percent =
    positionSeconds === null || durationSeconds === null || durationSeconds === 0
      ? null
      : Math.round((positionSeconds / durationSeconds) * 100).toString();

  return {
    ...shared,
    lead: words(
      isListening
        ? 'server.webhooks.discordEmbedFor.viewerStoppedListening'
        : 'server.webhooks.discordEmbedFor.viewerStoppedWatching',
      { viewer },
    ),
    tags: [
      ...(positionSeconds === null
        ? []
        : [
            durationSeconds === null || durationSeconds === 0
              ? say('server.webhooks.notice.stoppedAtPosition', {
                  position: positionOf(positionSeconds),
                })
              : say('server.webhooks.notice.stoppedAtPositionOf', {
                  position: positionOf(positionSeconds),
                  duration: positionOf(durationSeconds),
                }),
          ]),
      ...(percent === null
        ? []
        : [
            isListening
              ? say('server.webhooks.notice.percentListened', { percent })
              : say('server.webhooks.notice.percentWatched', { percent }),
          ]),
    ],
  };
};

/**
 * A title arriving in a library or leaving it.
 *
 * @param payload - The event.
 * @returns The notice's parts.
 */
const mediaParts = (
  payload: Extract<WebhookPayload, { event: 'media.added' | 'media.removed' }>,
): NoticeParts => {
  const item = payload.data;
  const isAdded = payload.event === 'media.added';
  const runtime = describeSpan(item.durationSeconds);
  const shared = {
    title: nameOfItem(item),
    posterUrl: item.posterUrl,
    footer: item.libraryName,
  };

  if (!isAdded) {
    return {
      ...shared,
      lead: words('server.webhooks.discordEmbedFor.noLongerInLibraryName', {
        libraryName: strong(item.libraryName),
      }),
      tone: 'quiet',
    };
  }

  return {
    ...shared,
    lead: words('server.webhooks.discordEmbedFor.arrivedInLibraryName', {
      libraryName: strong(item.libraryName),
    }),
    body: item.overview ?? '',
    tags: [
      MEDIA_KIND_LABELS[item.kind],
      ...(runtime === null ? [] : [runtime]),
      ...(item.quality === null ? [] : [item.quality]),
      ...(item.rating === null || item.rating <= 0
        ? []
        : [say('server.webhooks.notice.rating', { rating: item.rating.toFixed(1) })]),
    ],
    context: item.genres.slice(0, GENRES_SHOWN),
    tone: 'arrival',
  };
};

/**
 * The notice's parts for an event about the server, its services and its jobs.
 *
 * @param payload - The event.
 * @param serverName - What the server is called.
 * @returns The notice's parts.
 */
const serverParts = (payload: ServerEvent, serverName: string): NoticeParts => {
  switch (payload.event) {
    case 'webhook.test': {
      return {
        title: say('server.webhooks.notice.serverCanReachThisWebhook', { server: serverName }),
        lead: [say('server.webhooks.notice.testLead')],
        tone: 'quiet',
        footer: say('common.webhooks'),
      };
    }

    case 'job.completed': {
      return {
        title: say('contracts.schemas.webhook.jobFinished'),
        lead: words('server.webhooks.notice.jobHasFinished', { job: strong(payload.data.label) }),
        context: payload.data.subjectName === null ? [] : [payload.data.subjectName],
        tone: 'quiet',
        footer: say('common.jobs'),
      };
    }

    case 'job.failed': {
      return {
        title: say('contracts.schemas.webhook.jobFailed'),
        lead: words('server.webhooks.notice.jobHasFailed', { job: strong(payload.data.label) }),
        context: payload.data.subjectName === null ? [] : [payload.data.subjectName],
        ...problemOf(payload.data.reason),
        tone: 'failure',
        footer: say('common.jobs'),
      };
    }

    case 'job.stalled': {
      return {
        title: say('server.webhooks.notice.jobKeepsFailing'),
        lead: words(
          payload.data.everSucceeded
            ? 'server.webhooks.notice.jobFailsSinceItWorked'
            : 'server.webhooks.notice.jobHasNeverWorked',
          { job: strong(payload.data.label) },
        ),
        tags: [sayCount('screens.admin.describeAuditDetail.attempts', payload.data.failures)],
        details: [
          {
            label: say('server.webhooks.notice.latestError'),
            text: payload.data.reason,
            look: 'quote',
          },
        ],
        tone: 'failure',
        footer: say('common.jobs'),
      };
    }

    case 'job.working': {
      return backAgain(
        say('server.webhooks.notice.jobWorksAgain'),
        words('server.webhooks.notice.jobRunsAgain', { job: strong(payload.data.label) }),
        say('common.jobs'),
      );
    }

    case 'library.scanned': {
      return scanParts(payload.data);
    }

    case 'catalogue.unreachable': {
      return {
        title: say('server.webhooks.notice.catalogueDown'),
        lead: [say('server.webhooks.notice.catalogueDownLead')],
        tone: 'failure',
        footer: say('common.server'),
      };
    }

    case 'catalogue.reachable': {
      return backAgain(
        say('server.webhooks.notice.catalogueBack'),
        [say('server.webhooks.notice.reachableAgain')],
        say('common.server'),
      );
    }

    case 'transcoder.unreachable': {
      return {
        title: say('server.webhooks.notice.transcoderDown'),
        ...problemOf(payload.data.reason),
        tone: 'failure',
        footer: say('common.server'),
      };
    }

    case 'transcoder.reachable': {
      return backAgain(
        say('server.webhooks.notice.transcoderBack'),
        [say('server.webhooks.notice.respondingAgain')],
        say('common.server'),
      );
    }

    case 'disk.low':
    case 'disk.recovered': {
      const { mountPoint, availableBytes, totalBytes } = payload.data;
      const isLow = payload.event === 'disk.low';
      const percent = totalBytes === 0 ? 0 : (availableBytes / totalBytes) * 100;

      return {
        title: isLow
          ? say('server.webhooks.notice.runningOutOfSpace')
          : say('server.webhooks.notice.spaceFreedUp'),
        lead: words('server.webhooks.notice.freeOfTotal', {
          mount: strong(mountPoint),
          free: strong(formatBytes(availableBytes)),
          total: formatBytes(totalBytes),
        }),
        context:
          totalBytes === 0
            ? []
            : [
                say('server.webhooks.notice.percentFree', {
                  percent: percent < 10 ? percent.toFixed(1) : Math.round(percent).toString(),
                }),
              ],
        tone: isLow ? 'failure' : 'arrival',
        footer: say('common.server'),
      };
    }
  }
};

/**
 * The notice's parts for an event about the requests service itself rather than one request.
 *
 * @param payload - The event.
 * @returns The notice's parts.
 */
const requestsServiceParts = (payload: RequestsServiceEvent): NoticeParts => {
  const footer = say('common.requests');

  switch (payload.event) {
    case 'requests.unreachable': {
      return {
        title: say('server.webhooks.notice.requestsDown'),
        ...problemOf(payload.data.reason, payload.data.docs),
        tone: 'failure',
        footer,
      };
    }

    case 'requests.reachable': {
      return backAgain(
        say('server.webhooks.notice.requestsBack'),
        [say('server.webhooks.notice.respondingAgain')],
        footer,
      );
    }

    case 'requests.vpnDown': {
      return {
        title: say('server.webhooks.notice.vpnDown'),
        ...problemOf(payload.data.reason, payload.data.docs),
        tone: 'failure',
        footer,
      };
    }

    case 'requests.vpnUp': {
      const { publicAddress, country } = payload.data;

      return {
        title: say('server.webhooks.notice.vpnUp'),
        context: [
          ...(publicAddress === null
            ? []
            : [say('server.webhooks.notice.publicAddress', { address: publicAddress })]),
          ...(country === null ? [] : [country]),
        ],
        tone: 'arrival',
        footer,
      };
    }

    case 'requests.indexerFailing': {
      return {
        title: say('server.webhooks.notice.indexerFailing'),
        lead: words('server.webhooks.notice.indexerKeepsFailing', {
          indexer: strong(payload.data.name),
        }),
        ...problemOf(payload.data.problem, payload.data.docs),
        tone: 'failure',
        footer,
      };
    }

    case 'requests.indexerWorking': {
      return backAgain(
        say('server.webhooks.notice.indexerBack'),
        words('server.webhooks.notice.indexerRespondsAgain', {
          indexer: strong(payload.data.name),
        }),
        footer,
      );
    }

    case 'requests.downloadStarted': {
      return {
        title: say('contracts.schemas.webhook.downloadStarted'),
        lead: [strong(payload.data.title)],
        context: [say('server.webhooks.notice.sentToClient', { client: payload.data.client })],
        tone: 'arrival',
        footer,
      };
    }

    case 'requests.downloadFailed': {
      return {
        title: say('common.downloadFailed'),
        lead: [strong(payload.data.title)],
        context: [payload.data.client],
        ...problemOf(payload.data.problem),
        tone: 'failure',
        footer,
      };
    }
  }
};

/**
 * The notice's parts for an event about people: signing in, accounts, roles and sessions.
 *
 * @param payload - The event.
 * @param serverName - What the server is called.
 * @returns The notice's parts.
 */
const peopleParts = (payload: PeopleEvent, serverName: string): NoticeParts => {
  switch (payload.event) {
    case 'auth.succeeded': {
      return {
        title: say('server.webhooks.discordEmbedFor.nameSignedIn', { name: payload.data.name }),
        context: placesOf(payload.data),
        tone: 'attention',
        footer: say('common.accounts'),
      };
    }

    case 'auth.failed': {
      return {
        title: say('server.webhooks.discordEmbedFor.aSignInWasRefused'),
        lead: words('server.webhooks.notice.triedIdentifier', {
          identifier: strong(payload.data.identifier),
        }),
        context: placesOf(payload.data),
        details: [{ label: null, text: payload.data.reason, look: 'quote' }],
        tone: 'failure',
        footer: say('common.accounts'),
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
        context: placesOf(payload.data),
        tone: 'attention',
        footer: say('common.accounts'),
      };
    }

    case 'account.created': {
      return {
        title: say('server.webhooks.notice.newAccount'),
        lead: words('server.webhooks.discordEmbedFor.nameNowHasAnAccount', {
          name: strong(payload.data.name),
        }),
        tone: 'arrival',
        footer: say('common.accounts'),
      };
    }

    case 'account.deleted': {
      return {
        title: say('contracts.schemas.webhook.accountDeleted'),
        lead: words('server.webhooks.discordEmbedFor.nameSAccountWasDeleted', {
          name: strong(payload.data.name),
        }),
        tone: 'failure',
        footer: say('common.accounts'),
      };
    }

    case 'account.roleChanged': {
      const isGiven = payload.data.change === 'given';

      return {
        title: isGiven
          ? say('server.webhooks.notice.roleGiven')
          : say('server.webhooks.notice.roleTakenAway'),
        lead: words(
          isGiven
            ? 'server.webhooks.notice.wasGivenRole'
            : 'server.webhooks.notice.noLongerHasRole',
          { name: strong(payload.data.name), role: strong(payload.data.role) },
        ),
        tone: 'attention',
        footer: say('common.accounts'),
      };
    }

    case 'session.started': {
      const { accountName, profileName, guestOf } = payload.data;

      return {
        title: say('server.webhooks.viewerOpenedServer', {
          viewer: nameOfViewer(payload.data),
          server: serverName,
        }),
        context: [
          ...placesOf(payload.data),
          ...(guestOf === null || (accountName === null && profileName === null)
            ? []
            : [say('server.webhooks.notice.guestOf', { host: guestOf })]),
          ...(accountName === null || profileName === null || accountName === profileName
            ? []
            : [say('server.webhooks.notice.onAccount', { account: accountName })]),
        ],
        tone: 'viewing',
        footer: say('common.sessions'),
      };
    }

    case 'session.ended': {
      const stayed = describeSpan(payload.data.lastedSeconds);

      return {
        title: say('server.webhooks.viewerClosedServer', {
          viewer: nameOfViewer(payload.data),
          server: serverName,
        }),
        context: placesOf({ ...payload.data, address: null }),
        tags: stayed === null ? [] : [say('server.webhooks.notice.stayed', { span: stayed })],
        tone: 'quiet',
        footer: say('common.sessions'),
      };
    }
  }
};

/**
 * The notice's parts for any event, by which kind of thing it is about.
 *
 * @param payload - The event.
 * @param serverName - What the server is called.
 * @returns The notice's parts.
 */
const partsFor = (payload: WebhookPayload, serverName: string): NoticeParts => {
  switch (payload.event) {
    case 'media.added':
    case 'media.removed': {
      return mediaParts(payload);
    }

    case 'playback.started':
    case 'playback.stopped': {
      return playbackParts(payload);
    }

    case 'plugin.event': {
      return {
        title: payload.data.title,
        tags: Object.entries(payload.data.detail)
          .slice(0, PLUGIN_DETAILS_SHOWN)
          .flatMap(([name, value]) => {
            const tag = pluginTagOf(name, value);

            return tag === null ? [] : [tag];
          }),
        tone: 'quiet',
        footer: payload.data.pluginName,
      };
    }

    case 'requests.made':
    case 'requests.approved':
    case 'requests.refused':
    case 'requests.chosen':
    case 'requests.filed':
    case 'requests.available': {
      return requestEventParts(payload) ?? bareRequestParts(payload);
    }

    case 'webhook.test':
    case 'job.completed':
    case 'job.failed':
    case 'job.stalled':
    case 'job.working':
    case 'library.scanned':
    case 'catalogue.unreachable':
    case 'catalogue.reachable':
    case 'transcoder.unreachable':
    case 'transcoder.reachable':
    case 'disk.low':
    case 'disk.recovered': {
      return serverParts(payload, serverName);
    }

    case 'requests.unreachable':
    case 'requests.reachable':
    case 'requests.vpnDown':
    case 'requests.vpnUp':
    case 'requests.indexerFailing':
    case 'requests.indexerWorking':
    case 'requests.downloadStarted':
    case 'requests.downloadFailed': {
      return requestsServiceParts(payload);
    }

    case 'auth.succeeded':
    case 'auth.failed':
    case 'profile.chosen':
    case 'account.created':
    case 'account.deleted':
    case 'account.roleChanged':
    case 'session.started':
    case 'session.ended': {
      return peopleParts(payload, serverName);
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
 * Decides what any receiver is told about one event, before any receiver's own shape or limits
 * are applied.
 *
 * @param payload - What happened.
 * @param serverName - What the server is called: Valence, or the name it was given under Branding.
 * @returns The notice.
 */
const webhookNoticeFor = (
  payload: WebhookPayload,
  serverName: string = say('common.valence'),
): WebhookNotice => {
  const parts = partsFor(payload, serverName);
  const posterUrl = parts.posterUrl ?? null;

  return {
    title: parts.title,
    lead: parts.lead ?? [],
    context: (parts.context ?? [])
      .map((one) => one.replace(/\s+/gu, ' ').trim())
      .filter((one) => one !== ''),
    body: parts.body ?? '',
    tags: (parts.tags ?? [])
      .map((one) => clipText(one.replace(/\s+/gu, ' ').trim(), TAG_LIMIT))
      .filter((one) => one !== ''),
    details: parts.details ?? [],
    sections: parts.sections ?? [],
    link: parts.link ?? null,
    footer: parts.footer ?? null,
    tone: parts.tone,
    isUrgent: URGENT_EVENTS.has(payload.event),
    posterUrl: posterUrl !== null && /^https?:\/\//.test(posterUrl) ? posterUrl : null,
  };
};

export { webhookNoticeFor };

export type { NoticeDetail, NoticeLink, NoticeSection, NoticeWords, WebhookNotice, WebhookTone };
