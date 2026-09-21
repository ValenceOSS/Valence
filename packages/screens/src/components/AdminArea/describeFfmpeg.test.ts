import { describe, expect, it } from 'vitest';
import { describeFfmpeg } from './describeFfmpeg';

describe('describeFfmpeg', () => {
  it('names the version and says it is the build Valence ships', () => {
    expect(
      describeFfmpeg(
        'ffmpeg version 8.1.2-5.2-Valence Copyright (c) 2000-2026 the FFmpeg developers',
      ),
    ).toBe('FFmpeg 8.1.2-5.2-Valence, the build Valence ships');
  });

  it('still recognises a build from before it was renamed', () => {
    expect(describeFfmpeg('ffmpeg version 7.1-Flux Copyright (c) 2000-2025')).toBe(
      'FFmpeg 7.1-Flux, the build Valence ships',
    );
  });

  it('says so where it is somebody else’s build', () => {
    expect(describeFfmpeg('ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023')).toBe(
      'FFmpeg 6.1.1-3ubuntu5, not the build Valence ships',
    );
  });

  it.each([null, 'unknown', '', 'ffmpeg version'])('has nothing to say for %s', (banner) => {
    expect(describeFfmpeg(banner)).toBeNull();
  });
});
