import { describe, expect, it } from 'vitest';
import {
  Monitor22k as Monitor2kIcon,
  Monitor24k as Monitor4kIcon,
  Monitor2Hd as MonitorHdIcon,
  Monitor2Sd as MonitorSdIcon,
} from '@keyline-icons/react/fill';
import { resolutionIconOf } from './resolutionIconOf';

describe('resolutionIconOf', () => {
  it('marks 4K and 1440p as their own tiers', () => {
    expect(resolutionIconOf('2160p')).toBe(Monitor4kIcon);
    expect(resolutionIconOf('1440p')).toBe(Monitor2kIcon);
  });

  it('marks 1080p and 720p as HD', () => {
    expect(resolutionIconOf('1080p')).toBe(MonitorHdIcon);
    expect(resolutionIconOf('720p')).toBe(MonitorHdIcon);
  });

  it('marks everything smaller as SD', () => {
    expect(resolutionIconOf('480p')).toBe(MonitorSdIcon);
    expect(resolutionIconOf('144p')).toBe(MonitorSdIcon);
  });
});
