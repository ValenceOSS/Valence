import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { qualityTagOf } from './qualityTagOf';

describe('qualityTagOf', () => {
  it('says the resolution, the source, the codec and the audio', () => {
    expect(
      qualityTagOf(parseReleaseName('Dune.Part.Two.2024.2160p.UHD.BluRay.REMUX.HEVC.TrueHD.7.1')),
    ).toBe(' [2160p][Remux][x265][TrueHD 7.1]');
  });

  it('names Atmos after the codec carrying it rather than in place of it', () => {
    expect(qualityTagOf(parseReleaseName('Dune.2021.2160p.WEB-DL.DDP5.1.Atmos.H.265-FLUX'))).toBe(
      ' [2160p][WEBDL][x265][EAC3 Atmos 5.1]',
    );
  });

  it('leaves out what a name never said', () => {
    expect(qualityTagOf(parseReleaseName('Severance.S01E02.1080p'))).toBe(' [1080p]');
  });

  it('says nothing of a name that says nothing', () => {
    expect(qualityTagOf(parseReleaseName('Severance S01E02'))).toBe('');
  });

  it('names every source a release comes from', () => {
    expect(qualityTagOf(parseReleaseName('Show.S01E01.720p.HDTV.x264'))).toBe(
      ' [720p][HDTV][x264]',
    );
    expect(qualityTagOf(parseReleaseName('Show.S01E01.1080p.WEBRip.x265'))).toBe(
      ' [1080p][WEBRip][x265]',
    );
    expect(qualityTagOf(parseReleaseName('Show.S01E01.480p.DVDRip.XviD'))).toBe(
      ' [480p][DVD][XviD]',
    );
  });
});
