import { describe, expect, it } from 'vitest';
import { underTheCeiling } from './underTheCeiling';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

const PROFILE: DeviceProfile = {
  schemaVersion: 1,
  name: 'Living room TV',
  maxWidth: 3840,
  maxHeight: 2160,
  maxBitrateKbps: 40_000,
  maxAudioChannels: 8,
  supportedVideoRanges: ['SDR'],
  tenBitVideoCodecs: [],
  maxVideoLevels: {},
  canPlayInterlaced: true,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: ['webvtt'],
  directPlayProfiles: [],
  transcodingProfiles: [],
};

describe('underTheCeiling', () => {
  it('lowers what a client says it can take to what its account may stream at', () => {
    expect(underTheCeiling(PROFILE, 8000).maxBitrateKbps).toBe(8000);
  });

  it('keeps a client’s own ceiling where it is already lower', () => {
    expect(underTheCeiling({ ...PROFILE, maxBitrateKbps: 4000 }, 8000).maxBitrateKbps).toBe(4000);
  });

  it('gives a client that stated nothing the account’s ceiling', () => {
    expect(underTheCeiling({ ...PROFILE, maxBitrateKbps: null }, 8000).maxBitrateKbps).toBe(8000);
  });

  it('leaves the profile alone where the account may stream at any bitrate', () => {
    expect(underTheCeiling(PROFILE, null)).toBe(PROFILE);
  });
});
