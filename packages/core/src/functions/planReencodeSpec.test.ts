import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import { planReencodeSpec } from './planReencodeSpec';
import type { Capabilities } from './selectEncoder';

const remux: MediaItem = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Harry Potter and the Prisoner of Azkaban',
  container: 'mkv',
  durationSeconds: 8520,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 66000,
  sizeBytes: 70_000_000_000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
    { index: 2, codec: 'aac', channels: 2, language: 'eng', isDefault: false, isAtmos: false },
  ],
  subtitleStreams: [{ index: 3, format: 'pgs', language: 'eng', isForced: false }],
};

const capabilities: Capabilities = {
  encoders: [
    { codec: 'hevc', encoder: 'hevc_qsv', accel: 'qsv' },
    { codec: 'hevc', encoder: 'libx265', accel: 'none' },
    { codec: 'h264', encoder: 'libx264', accel: 'none' },
    { codec: 'eac3', encoder: 'eac3', accel: 'none' },
  ],
};

const replacing: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

const ask = (settings: ReencodeSettings, held = capabilities) =>
  planReencodeSpec({
    item: remux,
    settings,
    inputPath: '/media/Films/Azkaban (2004)/Azkaban (2004).mkv',
    capabilities: held,
  });

describe('planReencodeSpec', () => {
  it('runs on the card where the card proved it can', () => {
    const outcome = ask(replacing);

    expect(outcome.kind).toBe('ok');
    expect(outcome.kind === 'ok' ? outcome.request.spec.hardwareAccel : '').toBe('qsv');
    expect(outcome.kind === 'ok' ? outcome.request.spec.video : null).toMatchObject({
      kind: 'encode',
      encoder: 'hevc_qsv',
      maxHeight: 1080,
    });
  });

  it('refuses a codec this server cannot encode, rather than failing two hours in', () => {
    const outcome = ask({ ...replacing, videoCodec: 'av1' });

    expect(outcome.kind).toBe('unsupported');
    expect(outcome.kind === 'unsupported' ? outcome.reason : '').toContain('av1');
  });

  it('carries every track, with a decision each', () => {
    const outcome = ask({ ...replacing, audio: 'compress' });

    expect(outcome.kind === 'ok' ? outcome.request.carry.audio : []).toEqual([
      {
        kind: 'encode',
        streamIndex: 1,
        encoder: 'eac3',
        channels: 6,
        maxBitrateKbps: 640,
      },
      { kind: 'copy', streamIndex: 2 },
    ]);
  });

  it('carries the bitmap subtitle track, which is why the container never changes', () => {
    const outcome = ask(replacing);

    expect(outcome.kind === 'ok' ? outcome.request.carry.subtitleStreamIndexes : []).toEqual([3]);
  });

  it('copies the picture untouched for audio-only work, and needs no card for it', () => {
    const outcome = ask({
      mode: 'audioOnly',
      quality: null,
      videoCodec: null,
      audio: 'compress',
    });

    expect(outcome.kind === 'ok' ? outcome.request.spec.video : null).toEqual({ kind: 'copy' });
    expect(outcome.kind === 'ok' ? outcome.request.spec.hardwareAccel : '').toBe('none');
  });

  it('refuses audio-only work where the server cannot encode the replacement', () => {
    const outcome = ask(
      { mode: 'audioOnly', quality: null, videoCodec: null, audio: 'compress' },
      { encoders: [{ codec: 'h264', encoder: 'libx264', accel: 'none' }] },
    );

    expect(outcome.kind).toBe('unsupported');
    expect(outcome.kind === 'unsupported' ? outcome.reason : '').toContain('eac3');
  });

  it('asks for keyframes at playback spacing, so the result can be segmented by copying', () => {
    const outcome = ask(replacing);

    expect(outcome.kind === 'ok' ? outcome.request.spec.segmentSeconds : 0).toBe(4);
  });

  it('keeps the chapters for a whole film and leaves them out of a sample', () => {
    const whole = ask(replacing);
    const sample = planReencodeSpec({
      item: remux,
      settings: replacing,
      inputPath: '/media/x.mkv',
      capabilities,
      keepsChapters: false,
    });

    expect(whole.kind === 'ok' ? whole.request.carry.keepsChapters : false).toBe(true);
    expect(sample.kind === 'ok' ? sample.request.carry.keepsChapters : true).toBe(false);
  });
});
