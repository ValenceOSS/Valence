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
    ).toEqual(
      'Its file, Spider-Man.Brand.New.Day.2026.V3.1080p.TELESYNC.x264-DKS_rxl1.mp4, is 1080p, which this profile does not take',
    );
  });

  it('refuses a source the profile does not take, at a resolution it does', () => {
    expect(whatTheFilesSay(['Film.2026.2160p.HDCAM.x265.mkv'], FOUR_K)?.message).toMatch(
      /a cinema recording/u,
    );
  });

  it('lets a file call its source something the title did not, which is only labelling', () => {
    const webOnly = aProfile({ resolutions: ['2160p'], sources: ['webdl'] });

    expect(whatTheFilesSay(['Film.2026.2160p.WEBRip.x265-GRP.mkv'], webOnly)).toBeNull();
    expect(whatTheFilesSay(['Film.2026.2160p.BluRay.x265-GRP.mkv'], webOnly)).toBeNull();
  });

  it('takes a cinema recording where the profile asks for one', () => {
    expect(
      whatTheFilesSay(
        ['Film.2026.2160p.TELESYNC.mkv'],
        aProfile({ resolutions: ['2160p'], sources: ['telesync'] }),
      ),
    ).toBeNull();
  });

  it('takes a file that says what the profile asked for', () => {
    expect(whatTheFilesSay(['Film.2026.2160p.WEB-DL.DDP5.1.H.265-GRP.mkv'], FOUR_K)).toBeNull();
  });

  it('takes a file whose name says nothing, which is no evidence either way', () => {
    expect(whatTheFilesSay(['Season 1/Episode 03.mkv'], FOUR_K)).toBeNull();
  });

  it('reads the file, not the folders it is in', () => {
    expect(whatTheFilesSay(['Film.2026.2160p.WEB-DL/Film.1080p.mkv'], FOUR_K)?.message).toMatch(
      /Its file, Film\.1080p\.mkv, is 1080p/u,
    );
  });

  it('reads the file, not its folder, on a client that lists Windows paths', () => {
    expect(whatTheFilesSay(['Film.2026.1080p.WEB-DL\\Episode 03.mkv'], FOUR_K)).toBeNull();
  });

  it('leaves music alone, which has no resolution to be wrong about', () => {
    expect(whatTheFilesSay(['01 - Track 1080p.flac'], aProfile({ kind: 'music' }))).toBeNull();
  });
});
