import { describe, expect, it } from 'vitest';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import { audioKbpsOf } from './audioKbpsOf';

const track = (codec: string, channels: number): AudioStream => ({
  index: 1,
  codec,
  channels,
  language: 'eng',
  isDefault: true,
  isAtmos: false,
});

describe('audioKbpsOf', () => {
  it('weighs a lossless track by its channel count, which is where the arithmetic holds', () => {
    expect(audioKbpsOf(track('truehd', 8))).toBe(4800);
    expect(audioKbpsOf(track('truehd', 6))).toBe(3600);
  });

  it('weighs a compressed track by what a track of that width is usually given', () => {
    expect(audioKbpsOf(track('aac', 2))).toBe(192);
    expect(audioKbpsOf(track('eac3', 6))).toBe(448);
  });

  it('gives an unusually wide compressed track more than a 5.1 one', () => {
    expect(audioKbpsOf(track('eac3', 8))).toBeGreaterThan(audioKbpsOf(track('eac3', 6)));
  });

  it('puts a lossless track well above a compressed one of the same width', () => {
    expect(audioKbpsOf(track('dtshd', 6))).toBeGreaterThan(audioKbpsOf(track('ac3', 6)));
  });
});
