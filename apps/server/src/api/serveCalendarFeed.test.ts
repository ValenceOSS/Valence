import { describe, expect, it, vi } from 'vitest';
import { addDays } from '@ValenceCore/functions/addDays';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryCalendarFeedService } from '@ValenceServer/calendarFeed/createMemoryCalendarFeedService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { jobDefinitionsFor } from '@ValenceServer/jobs/jobDefinitions';
import {
  CalendarFeedStatusSchema,
  CalendarFeedSchema,
} from '@ValenceContracts/schemas/CalendarFeed';
import type { CalendarEpisode } from '@ValenceServer/calendar/CalendarEpisode';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const TODAY = new Date().toISOString().slice(0, 10);

const EPISODE: CalendarEpisode = {
  show: {
    id: 'show-1',
    libraryId: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
    title: 'A Show',
    seasonCount: 1,
    episodeCount: 3,
    latestAddedAt: '2026-10-01T10:00:00.000Z',
    coverMediaId: '2b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
    seriesId: '3b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  },
  externalId: '300',
  seasonNumber: 1,
  episodeNumber: 4,
  title: 'Fourth',
  airDate: addDays(TODAY, 3),
  stillUrl: null,
  isHeld: false,
};

const build = async () => {
  const { auth, settings, store } = createMemoryAuth();
  const releaseCalendar = vi.fn<
    (viewer: Viewer, from: string, to: string) => Promise<CalendarEpisode[]>
  >(() => Promise.resolve([EPISODE]));
  const library = createMemoryLibraryService({ libraries: [], media: [] });

  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    requests: null,
    requestsClient: null,
    jobDefinitions: jobDefinitionsFor(false),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: { ...library, releaseCalendar },
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    calendarFeeds: createMemoryCalendarFeedService(),
  });

  const cookie = await signUpForTest(app);
  const signedIn = { cookie, origin: TEST_ORIGIN };

  const call = (method: string, path: string, headers: Record<string, string> = signedIn) =>
    app.request(`${TEST_ORIGIN}${path}`, { method, headers });

  const ensure = async () =>
    CalendarFeedSchema.parse(await (await call('POST', '/api/calendar/feed')).json());

  const renew = async () =>
    CalendarFeedSchema.parse(await (await call('POST', '/api/calendar/feed/renew')).json());

  return { call, ensure, renew, releaseCalendar, accountId: store.user[0]?.id ?? '' };
};

describe('the calendar feed', () => {
  it('turns away somebody not signed in from their link', async () => {
    const { call } = await build();

    expect((await call('GET', '/api/calendar/feed', {})).status).toBe(401);
    expect((await call('POST', '/api/calendar/feed', {})).status).toBe(401);
    expect((await call('POST', '/api/calendar/feed/renew', {})).status).toBe(401);
    expect((await call('DELETE', '/api/calendar/feed', {})).status).toBe(401);
  });

  it('says there is no link until one is asked for, then hands back the same one', async () => {
    const { call, ensure } = await build();

    expect(
      CalendarFeedStatusSchema.parse(await (await call('GET', '/api/calendar/feed')).json()).feed,
    ).toBeNull();

    const made = await ensure();

    expect(
      CalendarFeedStatusSchema.parse(await (await call('GET', '/api/calendar/feed')).json()).feed
        ?.token,
    ).toBe(made.token);
    expect((await ensure()).token).toBe(made.token);
  });

  it('serves the calendar by its link with no sign-in, worked out for whoever made it', async () => {
    const { call, ensure, releaseCalendar, accountId } = await build();
    const { token } = await ensure();
    const response = await call('GET', `/api/calendar/feed/${token ?? ''}.ics`, {});
    const written = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/calendar; charset=utf-8');
    expect(written).toContain('BEGIN:VCALENDAR');
    expect(written).toContain('SUMMARY:A Show · S1 E4 · Fourth\r\n');
    expect(written).toContain(`DTSTART;VALUE=DATE:${addDays(TODAY, 3).replaceAll('-', '')}`);
    expect(releaseCalendar).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'account', accountId }),
      addDays(TODAY, -30),
      addDays(TODAY, 89),
    );
  });

  it('stops an old link working once a new one is made, or the link is turned off', async () => {
    const { call, ensure, renew } = await build();
    const first = await ensure();
    const second = await renew();

    expect((await call('GET', `/api/calendar/feed/${first.token ?? ''}.ics`, {})).status).toBe(404);
    expect((await call('GET', `/api/calendar/feed/${second.token ?? ''}.ics`, {})).status).toBe(
      200,
    );

    expect((await call('DELETE', '/api/calendar/feed')).status).toBe(204);
    expect((await call('GET', `/api/calendar/feed/${second.token ?? ''}.ics`, {})).status).toBe(
      404,
    );
  });

  it('asks for sign-in for anything under the feed that is not a link', async () => {
    const { call } = await build();

    expect((await call('GET', '/api/calendar/feed/short.ics', {})).status).toBe(401);
  });
});
