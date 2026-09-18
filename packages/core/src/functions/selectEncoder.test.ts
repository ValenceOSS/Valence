import { describe, expect, it } from 'vitest';
import { selectEncoder } from './selectEncoder';
import type { Capabilities } from './selectEncoder';

const capabilities: Capabilities = {
  encoders: [
    { codec: 'hevc', encoder: 'hevc_qsv', accel: 'qsv' },
    { codec: 'hevc', encoder: 'libx265', accel: 'none' },
    { codec: 'h264', encoder: 'libx264', accel: 'none' },
  ],
  chains: [{ accel: 'qsv', shape: 'transcode', bitDepth: 8, works: true }],
};

describe('selectEncoder', () => {
  it('prefers a card that proved both the encoder and the chain around it', () => {
    expect(selectEncoder(capabilities, 'hevc', '', 8)?.encoder).toBe('hevc_qsv');
  });

  it('falls back to software where the chain was measured and found broken', () => {
    const broken: Capabilities = {
      ...capabilities,
      chains: [{ accel: 'qsv', shape: 'transcode', bitDepth: 8, works: false }],
    };

    expect(selectEncoder(broken, 'hevc', '', 8)?.encoder).toBe('libx265');
  });

  it('uses what an operator forced, which is how they investigate a rejection', () => {
    expect(selectEncoder(capabilities, 'hevc', 'qsv')?.encoder).toBe('hevc_qsv');
  });

  it('answers nothing for a codec this server cannot encode at all', () => {
    expect(selectEncoder(capabilities, 'av1')).toBeNull();
  });
});
