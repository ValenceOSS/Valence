import { describe, expect, it } from 'vitest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { whatTheFilesSay } from './whatTheFilesSay';

const FOUR_K = aProfile({ name: '4K', resolutions: ['2160p'] });

describe('whatTheFilesSay', () => {
  it('refuses a film sold as 4K whose file is a 1080p telesync', () => {
    expect(
      whatTheFilesSay(
        ['Spider-Man.Brand.New.Day.2026.V3.1080p.TELESYNC.x264-DKS_rxl1.mp4'],
        FOUR_K,
      ),
    ).toBe(
      'Its file, Spider-Man.Brand.New.Day.2026.V3.1080p.TELESYNC.x264-DKS_rxl1.mp4, is 1080p, which this profile does not take',
    );
  });

  it('refuses a source the profile does not take, at a resolution it does', () => {
    expect(whatTheFilesSay(['Film.2026.2160p.HDCAM.x265.mkv'], FOUR_K)).toMatch(
      /a cinema recording/u,
    );
  });

  it('takes a file that says what the profile asked for', () => {
    expect(whatTheFilesSay(['Film.2026.2160p.WEB-DL.DDP5.1.H.265-GRP.mkv'], FOUR_K)).toBeNull();
  });

  it('takes a file whose name says nothing, which is no evidence either way', () => {
    expect(whatTheFilesSay(['Season 1/Episode 03.mkv'], FOUR_K)).toBeNull();
  });

  it('reads the file, not the folders it is in', () => {
    expect(whatTheFilesSay(['Film.2026.2160p.WEB-DL/Film.1080p.mkv'], FOUR_K)).toMatch(
      /Its file, Film\.1080p\.mkv, is 1080p/u,
    );
  });

  it('leaves music alone, which has no resolution to be wrong about', () => {
    expect(whatTheFilesSay(['01 - Track 1080p.flac'], aProfile({ kind: 'music' }))).toBeNull();
  });
});
