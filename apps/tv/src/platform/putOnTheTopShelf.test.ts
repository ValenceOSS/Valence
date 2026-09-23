import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { putOnTheTopShelf } from '@ValenceTv/platform/putOnTheTopShelf';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const mockPublish = jest.fn<Promise<void>, [object[], Record<string, string>]>(() =>
  Promise.resolve(),
);

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => ({
    publish: (entries: object[], headers: Record<string, string>) => mockPublish(entries, headers),
  }),
}));

const aTitle = (id: string, overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id,
  libraryId: '00000000-0000-4000-8000-0000000000ff',
  title: `Film ${id}`,
  year: 2024,
  durationSeconds: 6000,
  width: 3840,
  height: 2160,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-09-23T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  ...overrides,
});

beforeEach(() => {
  mockPublish.mockClear();
  rememberServerAddress('http://valence.local:3000');
  keepTheSessionToken('secret');
});

describe('putOnTheTopShelf', () => {
  it('shelves each title with its picture on the server, signed as whoever is watching', () => {
    putOnTheTopShelf([
      aTitle('a'),
      aTitle('b', { title: 'Pilot', seriesTitle: 'The Bear', seriesId: 'the-bear' }),
    ]);

    expect(mockPublish).toHaveBeenCalledWith(
      [
        {
          id: 'a',
          title: 'Film a',
          kind: 'film',
          imageUrl: 'http://valence.local:3000/api/media/a/image/backdrop',
        },
        {
          id: 'b',
          title: 'The Bear',
          kind: 'show',
          imageUrl: 'http://valence.local:3000/api/media/b/image/backdrop',
        },
      ],
      { authorization: 'Bearer secret' },
    );
  });

  it('leaves off titles without a picture', () => {
    putOnTheTopShelf([aTitle('a', { hasBackdrop: false }), aTitle('b')]);

    expect(mockPublish.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('shelves only the newest ten', () => {
    putOnTheTopShelf(Array.from({ length: 14 }, (_, at) => aTitle(`t${at.toString()}`)));

    expect(mockPublish.mock.calls[0]?.[0]).toHaveLength(10);
  });

  it('does not mind the shelf refusing', async () => {
    mockPublish.mockImplementationOnce(() => Promise.reject(new Error('no shelf')));

    expect(() => {
      putOnTheTopShelf([aTitle('a')]);
    }).not.toThrow();

    await Promise.resolve();
  });
});
