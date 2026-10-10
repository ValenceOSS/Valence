import { describe, expect, it } from 'vitest';
import { DEFAULT_PRE_TRANSCODE_TARGET } from '@ValenceContracts/schemas/PreTranscoding';
import { preTranscodeTargetOf } from './preTranscodeTargetOf';

describe('preTranscodeTargetOf', () => {
  it('asks for a copy kept beside each film, in the rung’s picture, codec and container', () => {
    expect(preTranscodeTargetOf(DEFAULT_PRE_TRANSCODE_TARGET).settings).toEqual({
      mode: 'keep',
      quality: '1080p',
      videoCodec: 'h264',
      audio: 'keep',
      container: 'mp4',
      placement: 'beside',
    });
  });

  it('asks for a replacement, placed nowhere, for the rung that takes the original’s place', () => {
    const { settings } = preTranscodeTargetOf(DEFAULT_PRE_TRANSCODE_TARGET, 'replace');

    expect(settings.mode).toBe('replace');
    expect(settings.placement).toBeUndefined();
  });

  it('carries a bitrate ceiling where one was set', () => {
    expect(
      preTranscodeTargetOf({ ...DEFAULT_PRE_TRANSCODE_TARGET, maxBitrateKbps: 3000 }).settings
        .maxBitrateKbps,
    ).toBe(3000);
  });

  it('files copies and refusals under a key that changes whenever the copy would', () => {
    const key = preTranscodeTargetOf(DEFAULT_PRE_TRANSCODE_TARGET).key;

    expect(preTranscodeTargetOf({ ...DEFAULT_PRE_TRANSCODE_TARGET }).key).toBe(key);
    expect(preTranscodeTargetOf({ ...DEFAULT_PRE_TRANSCODE_TARGET, quality: '720p' }).key).not.toBe(
      key,
    );
    expect(
      preTranscodeTargetOf({ ...DEFAULT_PRE_TRANSCODE_TARGET, maxBitrateKbps: 2000 }).key,
    ).not.toBe(key);
    expect(preTranscodeTargetOf(DEFAULT_PRE_TRANSCODE_TARGET, 'replace').key).not.toBe(key);
  });
});
