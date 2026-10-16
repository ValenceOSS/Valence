import { describe, expect, it } from 'vitest';
import { ANIME_AUDIO_POLICIES } from '@ValenceContracts/schemas/AnimeAudioPolicy';
import { ANIME_AUDIO_NAMES } from './ANIME_AUDIO_NAMES';

describe('ANIME_AUDIO_NAMES', () => {
  it('names every way anime can be wanted to sound, each differently', () => {
    const names = ANIME_AUDIO_POLICIES.map((policy) => ANIME_AUDIO_NAMES[policy]);

    expect(new Set(names).size).toBe(ANIME_AUDIO_POLICIES.length);
    expect(ANIME_AUDIO_NAMES.subbed).toBe('Subtitles');
  });
});
