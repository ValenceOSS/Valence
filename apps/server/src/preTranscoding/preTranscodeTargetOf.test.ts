import { describe, expect, it } from 'vitest';
import { PRE_TRANSCODING_DEFAULTS } from '@ValenceContracts/schemas/PreTranscoding';
import { preTranscodeTargetOf } from './preTranscodeTargetOf';

describe('preTranscodeTargetOf', () => {
  it('asks for a copy kept beside each film, in the chosen picture, codec and container', () => {
    expect(preTranscodeTargetOf(PRE_TRANSCODING_DEFAULTS).settings).toEqual({
      mode: 'keep',
      quality: '1080p',
      videoCodec: 'h264',
      audio: 'keep',
      container: 'mp4',
      placement: 'beside',
    });
  });

  it('carries a bitrate ceiling where one was set', () => {
    expect(
      preTranscodeTargetOf({ ...PRE_TRANSCODING_DEFAULTS, maxBitrateKbps: 3000 }).settings
        .maxBitrateKbps,
    ).toBe(3000);
  });

  it('files a refusal under a key that changes whenever the copy would', () => {
    const key = preTranscodeTargetOf(PRE_TRANSCODING_DEFAULTS).key;

    expect(preTranscodeTargetOf({ ...PRE_TRANSCODING_DEFAULTS, isPaused: true }).key).toBe(key);
    expect(preTranscodeTargetOf({ ...PRE_TRANSCODING_DEFAULTS, quality: '720p' }).key).not.toBe(
      key,
    );
    expect(
      preTranscodeTargetOf({ ...PRE_TRANSCODING_DEFAULTS, maxBitrateKbps: 2000 }).key,
    ).not.toBe(key);
  });
});
