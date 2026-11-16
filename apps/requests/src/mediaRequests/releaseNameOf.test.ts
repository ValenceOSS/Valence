import { describe, expect, it } from 'vitest';
import { releaseNameOf } from './releaseNameOf';

describe('releaseNameOf', () => {
  it('takes the video’s own name where it reads as a release', () => {
    expect(
      releaseNameOf('A.Film.2020.1080p.WEB-DL.H264-EGEN', 'A Film 2020 1080p WEB-DL H264-EGEN'),
    ).toBe('A.Film.2020.1080p.WEB-DL.H264-EGEN');
  });

  it('takes the release it was fetched as where the video is named plainly', () => {
    expect(releaseNameOf('a-film', 'A.Film.2020.1080p.WEB-DL.H264-EGEN')).toBe(
      'A.Film.2020.1080p.WEB-DL.H264-EGEN',
    );
  });

  it('keeps what it has where only one is known', () => {
    expect(releaseNameOf(null, 'A.Film.2020.WEB-EGEN')).toBe('A.Film.2020.WEB-EGEN');
    expect(releaseNameOf('a-film', null)).toBe('a-film');
    expect(releaseNameOf(null, null)).toBeNull();
  });
});
