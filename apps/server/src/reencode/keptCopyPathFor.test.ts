import { describe, expect, it } from 'vitest';
import { isKeptCopy } from '@ValenceServer/library/isKeptCopy';
import { isMediaFile } from '@ValenceServer/library/isMediaFile';
import { keptCopyPathFor } from './keptCopyPathFor';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

const LIBRARY = '/media/Films';

const original = `${LIBRARY}/Arrival (2016)/Arrival (2016).mkv`;

const uhd = { width: 3840, height: 2160, videoCodec: 'hevc' };

const keeping: ReencodeSettings = {
  mode: 'keep',
  quality: '1080p',
  videoCodec: 'h264',
  audio: 'keep',
  container: 'mp4',
  placement: 'beside',
};

const inItsOwnContainer: ReencodeSettings = {
  mode: 'keep',
  quality: '1080p',
  videoCodec: 'h264',
  audio: 'keep',
};

const ask = (settings: ReencodeSettings, item = uhd) =>
  keptCopyPathFor({
    libraryPath: LIBRARY,
    originalPath: original,
    requestId: 'abc',
    item,
    settings,
  });

describe('keptCopyPathFor', () => {
  it('names a copy beside its film by what it is', () => {
    expect(ask(keeping)).toEqual({
      directory: `${LIBRARY}/Arrival (2016)`,
      output: `${LIBRARY}/Arrival (2016)/Arrival (2016) - 1080p H264.valence.mp4`,
    });
  });

  it('says the bitrate ceiling in the name where one was named', () => {
    expect(ask({ ...keeping, videoCodec: 'hevc', maxBitrateKbps: 3000 }).output).toBe(
      `${LIBRARY}/Arrival (2016)/Arrival (2016) - 1080p HEVC 3000kbps.valence.mp4`,
    );
  });

  it('names the same file for the same request, so asking twice never makes two', () => {
    expect(ask(keeping).output).toBe(ask({ ...keeping }).output);
  });

  it("names a copy of a smaller original by the original's own rung, since nothing grows", () => {
    expect(ask(keeping, { width: 1280, height: 720, videoCodec: 'hevc' }).output).toBe(
      `${LIBRARY}/Arrival (2016)/Arrival (2016) - 720p H264.valence.mp4`,
    );
  });

  it("keeps the original's container where none was chosen", () => {
    expect(ask({ ...inItsOwnContainer, placement: 'beside' }).output.endsWith('.valence.mkv')).toBe(
      true,
    );
  });

  it('is a name the scanner never takes for a film', () => {
    expect(isKeptCopy(ask(keeping).output)).toBe(true);
    expect(isMediaFile(ask(keeping).output)).toBe(false);
  });

  it("keeps a hidden copy in the library's Valence folder under the request", () => {
    expect(ask({ ...keeping, placement: 'hidden' })).toEqual({
      directory: `${LIBRARY}/.valence`,
      output: `${LIBRARY}/.valence/abc.mp4`,
    });
  });

  it("keeps a hidden copy in the original's container where none was chosen", () => {
    expect(ask(inItsOwnContainer).output).toBe(`${LIBRARY}/.valence/abc.mkv`);
  });
});
