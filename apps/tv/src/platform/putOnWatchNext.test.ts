import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { putOnWatchNext } from '@ValenceTv/platform/putOnWatchNext';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const mockContinue = jest.fn<Promise<void>, [object[], Record<string, string>]>(() =>
  Promise.resolve(),
);

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => ({
    continueWatching: (entries: object[], headers: Record<string, string>) =>
      mockContinue(entries, headers),
  }),
}));

const aTitle = (id: string, overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id,
  libraryId: '00000000-0000-4000-8000-0000000000ff',
  title: `Film ${id}`,
  year: 2024,
  durationSeconds: 6000,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-23T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  ...overrides,
});

const partWay = (mediaId: string, isFinished = false): WatchProgress => ({
  mediaId,
  positionSeconds: 600,
  durationSeconds: 6000,
  isFinished,
  updatedAt: '2026-10-06T12:00:00.000Z',
});

beforeEach(() => {
  mockContinue.mockClear();
  rememberServerAddress('http://valence.local:3000');
  keepTheSessionToken('secret');
});

describe('putOnWatchNext', () => {
  it('hands on each title with how far in it is and when it was watched, signed as the viewer', () => {
    putOnWatchNext([aTitle('a')], new Map([['a', partWay('a')]]));

    expect(mockContinue).toHaveBeenCalledWith(
      [
        {
          id: 'a',
          title: 'Film a',
          kind: 'film',
          imageUrl: 'http://valence.local:3000/api/media/a/image/backdrop',
          positionSeconds: 600,
          durationSeconds: 6000,
          watchedAt: Date.parse('2026-10-06T12:00:00.000Z'),
        },
      ],
      { authorization: 'Bearer secret' },
    );
  });

  it('leaves off titles without a picture, without progress, or already finished', () => {
    putOnWatchNext(
      [aTitle('a', { hasBackdrop: false }), aTitle('b'), aTitle('c'), aTitle('d')],
      new Map([
        ['a', partWay('a')],
        ['c', partWay('c', true)],
        ['d', partWay('d')],
      ]),
    );

    expect(mockContinue.mock.calls[0]?.[0]).toEqual([expect.objectContaining({ id: 'd' })]);
  });
});
