import { describe, expect, it, vi } from 'vitest';
import { SUBTITLE_DEFAULTS } from '@ValenceContracts/schemas/SubtitleSettings';
import { createGeneratedSubtitleService } from './createGeneratedSubtitleService';
import type { SubtitleTrack } from './SubtitleService';

const OWN: SubtitleTrack = {
  id: 'own',
  language: 'en',
  label: 'English',
  format: 'subrip',
  isForced: false,
  isHearingImpaired: false,
  delivery: 'text',
  streamIndex: 2,
};

type Heard =
  | { state: 'ready'; content: string; language: string | null }
  | { state: 'working' }
  | { state: 'unavailable' };

const READY: Heard = { state: 'ready', content: 'WEBVTT\n', language: 'en' };

const NONE: SubtitleTrack[] = [];

const aService = ({
  isOn = true,
  others = NONE,
  heard = READY,
}: { isOn?: boolean; others?: SubtitleTrack[]; heard?: Heard } = {}) => {
  const generateSubtitle = vi.fn(() => Promise.resolve(heard));
  const service = createGeneratedSubtitleService({
    media: { find: () => Promise.resolve({ path: '/media/film.mkv', audioStreamIndex: 1 }) },
    transcoder: { generateSubtitle },
    settings: () =>
      Promise.resolve({ ...SUBTITLE_DEFAULTS, writesSubtitles: isOn, whisperModel: 'small' }),
    others: () => Promise.resolve(others),
  });

  return { service, generateSubtitle };
};

describe('createGeneratedSubtitleService', () => {
  it('offers nothing and listens to nothing while writing is off', async () => {
    const { service, generateSubtitle } = aService({ isOn: false });

    await expect(service.list('film')).resolves.toEqual([]);
    expect(generateSubtitle).not.toHaveBeenCalled();
  });

  it('leaves a title that has subtitles of its own alone', async () => {
    const { service, generateSubtitle } = aService({ others: [OWN] });

    await expect(service.list('film')).resolves.toEqual([]);
    expect(generateSubtitle).not.toHaveBeenCalled();
  });

  it('asks the media service to listen to the title’s sound with the chosen model', async () => {
    const { service, generateSubtitle } = aService();

    await service.list('film');

    expect(generateSubtitle).toHaveBeenCalledWith({
      inputPath: '/media/film.mkv',
      audioStreamIndex: 1,
      model: 'small',
      language: null,
      translate: false,
    });
  });

  it('offers what was written as a text track marked as generated', async () => {
    const { service } = aService();
    const track = (await service.list('film'))?.[0];

    expect(track).toMatchObject({ language: 'en', format: 'generated', delivery: 'text' });
    expect(track?.label).toContain('Generated');
    await expect(service.read('film', track?.id ?? '')).resolves.toBe('WEBVTT\n');
  });

  it('offers nothing while the media service is still listening', async () => {
    const { service } = aService({ heard: { state: 'working' } });

    await expect(service.list('film')).resolves.toEqual([]);
  });

  it('reads no other track', async () => {
    const { service } = aService();

    await expect(service.read('film', 'somebody-else')).resolves.toBeNull();
    await expect(service.readCues('film', 'x')).resolves.toBeNull();
  });
});
