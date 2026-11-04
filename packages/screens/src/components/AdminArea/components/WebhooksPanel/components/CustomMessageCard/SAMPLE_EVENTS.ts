// oxlint-disable valence/no-hard-coded-strings -- sample webhook bodies, which webhooks send in English
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { WebhookEvent } from '@ValenceContracts/schemas/Webhook';

const SERVER = { name: 'Valence Dev', url: 'https://valence.example.com' };

/**
 * One sample event's values, as a Custom template is filled with them.
 *
 * @param event - The event.
 * @param eventLabel - Its name in words.
 * @param title - Its headline.
 * @param summary - Its one line.
 * @param extra - Anything more it carries.
 * @returns The values.
 */
const message = (
  event: string,
  eventLabel: string,
  title: string,
  summary: string,
  extra: {
    body?: string;
    poster?: string | null;
    link?: string | null;
    urgent?: boolean;
    tone?: string;
    data?: JsonValue;
  } = {},
): JsonValue => ({
  event,
  eventLabel,
  id: '0f6b1c2e-6d1a-4f5e-9b8a-3c2d1e0f9a8b',
  occurredAt: '2026-11-03T21:42:07.000Z',
  title,
  summary,
  body: extra.body ?? '',
  poster: extra.poster ?? null,
  link: extra.link ?? null,
  urgent: extra.urgent ?? false,
  tone: extra.tone ?? 'quiet',
  server: SERVER,
  data: extra.data ?? {},
});

const SAMPLE_EVENTS: Readonly<Partial<Record<WebhookEvent, JsonValue>>> = {
  'webhook.test': message(
    'webhook.test',
    'Test delivery',
    'Test delivery',
    'Valence can reach this webhook.',
  ),
  'job.failed': message(
    'job.failed',
    'Job failed',
    'Scan library failed',
    'Films couldn’t be scanned.',
    {
      body: 'The library folder /media/movies can’t be read: permission denied.',
      urgent: true,
      tone: 'failure',
      link: 'https://valence.example.com/admin/jobs',
      data: {
        kind: 'library.scan',
        label: 'Scan library',
        jobId: 'b41c…',
        subject: 'lib-films',
        subjectName: 'Films',
        reason: 'The library folder /media/movies can’t be read: permission denied.',
      },
    },
  ),
  'playback.started': message(
    'playback.started',
    'Started watching',
    'Sam started watching',
    'An episode, on the living-room TV.',
    {
      tone: 'viewing',
      poster: 'https://valence.example.com/api/artwork/ep-204/poster',
      data: {
        accountName: 'Sam',
        profileName: 'Sam',
        deviceLabel: 'Living room TV',
        clientLabel: 'Valence for Android TV',
        mode: 'DirectPlay',
        item: {
          kind: 'episode',
          title: 'Episode title',
          seriesTitle: 'Series title',
          seasonNumber: 2,
          episodeNumber: 4,
          year: 2024,
          libraryName: 'Shows',
          durationSeconds: 2820,
        },
      },
    },
  ),
  'media.added': message('media.added', 'Something arrived', 'A film arrived', 'Added to Films.', {
    tone: 'arrival',
    poster: 'https://valence.example.com/api/artwork/film-88/poster',
    link: 'https://valence.example.com/title/film-88',
    data: {
      item: {
        kind: 'movie',
        title: 'Film title',
        year: 2025,
        libraryName: 'Films',
        quality: '2160p HDR',
        genres: ['Drama', 'Mystery'],
        rating: 7.4,
      },
    },
  }),
  'requests.made': message(
    'requests.made',
    'Request made',
    'Alex asked for a series',
    'Seasons 1 and 2.',
    {
      tone: 'attention',
      poster: 'https://valence.example.com/api/requests/req-12/poster',
      link: 'https://valence.example.com/requests/req-12',
      data: {
        request: {
          id: 'req-12',
          kind: 'series',
          title: 'Series title',
          year: 2023,
          requestedBy: 'Alex',
          seasons: [1, 2],
          state: 'pending',
        },
      },
    },
  ),
  'requests.available': message(
    'requests.available',
    'Request ready',
    'Series title is ready',
    'Alex’s request is in the library.',
    {
      tone: 'arrival',
      link: 'https://valence.example.com/title/series-7',
      data: {
        request: { id: 'req-12', title: 'Series title', requestedBy: 'Alex', state: 'available' },
      },
    },
  ),
  'disk.low': message(
    'disk.low',
    'Disk space low',
    'Disk space is low',
    '/media has 18 GB left of 4 TB.',
    {
      urgent: true,
      tone: 'failure',
      data: { mountPoint: '/media', totalBytes: 4_000_000_000_000, availableBytes: 18_000_000_000 },
    },
  ),
  'account.created': message(
    'account.created',
    'Account made',
    'Jo has an account',
    'Made by an admin.',
    {
      data: { accountId: 'acc-9', accountName: 'Jo', role: 'Viewer' },
    },
  ),
};

export { SAMPLE_EVENTS };
