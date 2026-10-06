import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { shelfEntryOf } from '@ValenceTv/platform/shelfEntryOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const aTitle = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'a',
  libraryId: '00000000-0000-4000-8000-0000000000ff',
  title: 'A film',
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

describe('shelfEntryOf', () => {
  beforeEach(() => {
    rememberServerAddress('http://valence.local:3000');
  });

  it('names a film by its title, with its picture on the server', () => {
    expect(shelfEntryOf(aTitle())).toEqual({
      id: 'a',
      title: 'A film',
      kind: 'film',
      imageUrl: 'http://valence.local:3000/api/media/a/image/backdrop',
    });
  });

  it('names an episode by its show, and opens the show', () => {
    const entry = shelfEntryOf(
      aTitle({ title: 'Pilot', seriesTitle: 'A show', seriesId: 'a-show' }),
    );

    expect(entry.title).toBe('A show');
    expect(entry.kind).toBe('show');
  });
});
