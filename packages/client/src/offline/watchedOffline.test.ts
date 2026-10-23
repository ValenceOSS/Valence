import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import {
  forgetWatchedOffline,
  rememberWatchedOffline,
  sendWatchedOffline,
  watchedOffline,
} from './watchedOffline';

const ARRIVAL = '00000000-0000-4000-8000-000000000001';

const SOLARIS = '00000000-0000-4000-8000-000000000002';

const PAT = 'pat';

const SAM = 'sam';

const fetchWatchProgress = vi.fn<() => Promise<WatchProgress[]>>();
const reportWatchProgress = vi.fn<(mediaId: string, report: object) => Promise<boolean>>();

vi.mock('@ValenceClient/playback/watchProgress', () => ({
  fetchWatchProgress: () => fetchWatchProgress(),
  reportWatchProgress: (mediaId: string, report: object) => reportWatchProgress(mediaId, report),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  fetchWatchProgress.mockReset().mockResolvedValue([]);
  reportWatchProgress.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  forgetPlatform();
});

describe('rememberWatchedOffline', () => {
  it('writes down where somebody got to', () => {
    rememberWatchedOffline(ARRIVAL, 120, 6000, PAT, 1000);

    expect(watchedOffline(PAT)).toEqual([
      {
        mediaId: ARRIVAL,
        positionSeconds: 120,
        durationSeconds: 6000,
        atMs: 1000,
        server: platformInUse().serverAddress(),
        profileId: PAT,
      },
    ]);
  });

  it('keeps one answer per item rather than the route they took to it', () => {
    rememberWatchedOffline(ARRIVAL, 120, 6000, PAT, 1000);
    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);

    expect(watchedOffline(PAT)).toHaveLength(1);
    expect(watchedOffline(PAT)[0]?.positionSeconds).toBe(400);
  });

  it('keeps a separate answer for a separate film', () => {
    rememberWatchedOffline(ARRIVAL, 120, 6000, PAT, 1000);
    rememberWatchedOffline(SOLARIS, 30, 9000, PAT, 1000);

    expect(watchedOffline(PAT)).toHaveLength(2);
  });

  it('ignores a shuffle of a second or two, which the player reports constantly', () => {
    rememberWatchedOffline(ARRIVAL, 120, 6000, PAT, 1000);
    rememberWatchedOffline(ARRIVAL, 121, 6000, PAT, 2000);

    expect(watchedOffline(PAT)[0]?.positionSeconds).toBe(120);
  });

  it('refuses to record a position in something with no length', () => {
    rememberWatchedOffline(ARRIVAL, 120, 0, PAT, 1000);

    expect(watchedOffline(PAT)).toEqual([]);
  });

  it('reads nothing where the device has been cleared', () => {
    rememberWatchedOffline(ARRIVAL, 120, 6000, PAT, 1000);
    forgetWatchedOffline();

    expect(watchedOffline(PAT)).toEqual([]);
  });
});

describe('sendWatchedOffline', () => {
  it('does not go near the server where nothing was watched', async () => {
    expect(await sendWatchedOffline(PAT)).toBe(0);
    expect(fetchWatchProgress).not.toHaveBeenCalled();
  });

  it('tells the server about something it had never heard of', async () => {
    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);

    expect(await sendWatchedOffline(PAT)).toBe(1);
    expect(reportWatchProgress).toHaveBeenCalledWith(ARRIVAL, {
      positionSeconds: 400,
      durationSeconds: 6000,
      isFinished: false,
    });
  });

  it('says it was watched where this device saw it through to the credits', async () => {
    rememberWatchedOffline(ARRIVAL, 5950, 6000, PAT, 2000);

    await sendWatchedOffline(PAT);

    expect(reportWatchProgress).toHaveBeenCalledWith(ARRIVAL, {
      positionSeconds: 5950,
      durationSeconds: 6000,
      isFinished: true,
    });
  });

  it('tells the server where this device watched it more recently', async () => {
    fetchWatchProgress.mockResolvedValue([
      {
        mediaId: ARRIVAL,
        positionSeconds: 60,
        durationSeconds: 6000,
        isFinished: false,
        updatedAt: '2026-08-20T00:00:00.000Z',
      },
    ]);

    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, Date.parse('2026-08-21T00:00:00.000Z'));

    expect(await sendWatchedOffline(PAT)).toBe(1);
  });

  it('leaves alone something another device watched more recently', async () => {
    fetchWatchProgress.mockResolvedValue([
      {
        mediaId: ARRIVAL,
        positionSeconds: 60,
        durationSeconds: 6000,
        isFinished: false,
        updatedAt: '2026-08-23T00:00:00.000Z',
      },
    ]);

    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, Date.parse('2026-08-21T00:00:00.000Z'));

    expect(await sendWatchedOffline(PAT)).toBe(0);
    expect(reportWatchProgress).not.toHaveBeenCalled();
  });

  it('forgets everything once it has been sent, including what it decided not to send', async () => {
    fetchWatchProgress.mockResolvedValue([
      {
        mediaId: ARRIVAL,
        positionSeconds: 60,
        durationSeconds: 6000,
        isFinished: false,
        updatedAt: '2026-08-23T00:00:00.000Z',
      },
    ]);

    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, Date.parse('2026-08-21T00:00:00.000Z'));

    await sendWatchedOffline(PAT);

    expect(watchedOffline(PAT)).toEqual([]);
  });

  it('keeps it all for next time where the server could not be read, rather than guessing', async () => {
    fetchWatchProgress.mockRejectedValue(new Error('offline'));

    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);

    expect(await sendWatchedOffline(PAT)).toBe(0);
    expect(reportWatchProgress).not.toHaveBeenCalled();
    expect(watchedOffline(PAT)).toHaveLength(1);
  });

  it('tells the server only what this profile watched, keeping the rest for whoever watched it', async () => {
    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);
    rememberWatchedOffline(SOLARIS, 900, 6000, SAM, 2000);

    expect(await sendWatchedOffline(SAM)).toBe(1);
    expect(reportWatchProgress).toHaveBeenCalledWith(SOLARIS, expect.anything());
    expect(reportWatchProgress).not.toHaveBeenCalledWith(ARRIVAL, expect.anything());
    expect(watchedOffline(PAT).map((entry) => entry.mediaId)).toEqual([ARRIVAL]);
  });

  it('keeps what was watched on another server for when that server is back', async () => {
    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);
    installPlatform({ ...aFakePlatform(), serverAddress: () => 'https://elsewhere.example' });

    expect(await sendWatchedOffline(PAT)).toBe(0);
    expect(reportWatchProgress).not.toHaveBeenCalled();
  });

  it('sends what was watched before anybody could say who to whoever is watching on that server', async () => {
    rememberWatchedOffline(ARRIVAL, 400, 6000, null, 2000);

    expect(await sendWatchedOffline(SAM)).toBe(1);
  });

  it('keeps one place for a film first watched before anybody could say who, then as somebody', () => {
    installPlatform({ ...aFakePlatform(), serverAddress: () => 'https://valence.example' });
    rememberWatchedOffline(ARRIVAL, 400, 6000, null, 2000);
    rememberWatchedOffline(ARRIVAL, 900, 6000, PAT, 3000);

    expect(watchedOffline(PAT)).toEqual([expect.objectContaining({ positionSeconds: 900 })]);
  });

  it('sends only the newest place for a film, and forgets the older with it', async () => {
    platformInUse().store.write(
      'valence.offline.watched',
      JSON.stringify([
        { mediaId: ARRIVAL, positionSeconds: 900, durationSeconds: 6000, atMs: 3000 },
        {
          mediaId: ARRIVAL,
          positionSeconds: 400,
          durationSeconds: 6000,
          atMs: 2000,
          server: null,
          profileId: SAM,
        },
      ]),
    );

    expect(await sendWatchedOffline(SAM)).toBe(1);
    expect(reportWatchProgress).toHaveBeenCalledTimes(1);
    expect(reportWatchProgress).toHaveBeenCalledWith(
      ARRIVAL,
      expect.objectContaining({ positionSeconds: 900 }),
    );
    expect(watchedOffline(SAM)).toEqual([]);
  });

  it('keeps what was watched while the server was being told', async () => {
    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);
    reportWatchProgress.mockImplementation(() => {
      rememberWatchedOffline(SOLARIS, 900, 6000, PAT, 2500);

      return Promise.resolve(true);
    });

    expect(await sendWatchedOffline(PAT)).toBe(1);
    expect(watchedOffline(PAT).map((entry) => entry.mediaId)).toEqual([SOLARIS]);
  });

  it('sends nothing while it cannot tell who is watching', async () => {
    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);

    expect(await sendWatchedOffline(null)).toBe(0);
    expect(fetchWatchProgress).not.toHaveBeenCalled();
  });

  it('sends what was written before entries said whose they were to whoever is watching', async () => {
    platformInUse().store.write(
      'valence.offline.watched',
      JSON.stringify([
        { mediaId: ARRIVAL, positionSeconds: 400, durationSeconds: 6000, atMs: 2000 },
      ]),
    );

    expect(await sendWatchedOffline(SAM)).toBe(1);
  });

  it('keeps what the server never heard, and forgets what it did', async () => {
    reportWatchProgress.mockImplementation((mediaId) => Promise.resolve(mediaId === SOLARIS));

    rememberWatchedOffline(ARRIVAL, 400, 6000, PAT, 2000);
    rememberWatchedOffline(SOLARIS, 900, 6000, PAT, 2000);

    expect(await sendWatchedOffline(PAT)).toBe(1);
    expect(watchedOffline(PAT).map((entry) => entry.mediaId)).toEqual([ARRIVAL]);
  });
});
