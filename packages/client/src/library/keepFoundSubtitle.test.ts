import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keepFoundSubtitle } from './keepFoundSubtitle';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

const { fetchFoundSubtitle, fetchSubtitleTracks } = vi.hoisted(() => ({
  fetchFoundSubtitle: vi.fn(),
  fetchSubtitleTracks: vi.fn(),
}));

vi.mock('@ValenceClient/library/fetchFoundSubtitle', () => ({ fetchFoundSubtitle }));
vi.mock('@ValenceClient/playback/fetchSubtitles', () => ({ fetchSubtitleTracks }));

const track = (id: string, language: string | null): SubtitleTrack => ({
  id,
  language,
  label: id,
  format: 'srt',
  isForced: false,
  isHearingImpaired: false,
  delivery: 'text',
  streamIndex: null,
});

const CHOICE = { source: 'opensubtitles', id: '7', language: 'fr' } as const;

describe('keepFoundSubtitle', () => {
  beforeEach(() => {
    fetchFoundSubtitle.mockReset();
    fetchSubtitleTracks.mockReset();
  });

  it('hands back the tracks and the one that was not there before', async () => {
    fetchFoundSubtitle.mockResolvedValue({ name: 'Arrival.fr.srt' });
    fetchSubtitleTracks.mockResolvedValue([track('a', 'en'), track('b', 'fr')]);

    await expect(keepFoundSubtitle('m1', CHOICE, [track('a', 'en')])).resolves.toEqual({
      kind: 'kept',
      tracks: [track('a', 'en'), track('b', 'fr')],
      fresh: track('b', 'fr'),
    });
    expect(fetchFoundSubtitle).toHaveBeenCalledWith('m1', CHOICE);
  });

  it('takes the first track in the language where nothing new shows up', async () => {
    fetchFoundSubtitle.mockResolvedValue({ name: 'Arrival.fr.srt' });
    fetchSubtitleTracks.mockResolvedValue([track('a', 'en'), track('b', 'fre')]);

    const kept = await keepFoundSubtitle('m1', CHOICE, [track('a', 'en'), track('b', 'fre')]);

    expect(kept).toMatchObject({ kind: 'kept', fresh: track('b', 'fre') });
  });

  it('finds nothing to switch on where no track is in the language', async () => {
    fetchFoundSubtitle.mockResolvedValue({ name: 'Arrival.fr.srt' });
    fetchSubtitleTracks.mockResolvedValue([track('a', 'en')]);

    await expect(keepFoundSubtitle('m1', CHOICE, [track('a', 'en')])).resolves.toMatchObject({
      fresh: null,
    });
  });

  it('says why where the server would not keep it', async () => {
    fetchFoundSubtitle.mockResolvedValue({ problem: 'The site wouldn’t give it.' });

    await expect(keepFoundSubtitle('m1', CHOICE, [])).resolves.toEqual({
      kind: 'refused',
      problem: 'The site wouldn’t give it.',
    });
    expect(fetchSubtitleTracks).not.toHaveBeenCalled();
  });
});
