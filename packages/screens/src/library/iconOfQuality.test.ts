import {
  Layers as LayersIcon,
  Monitor as MonitorIcon,
  MonitorSparkles as MonitorSparklesIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import { describe, expect, it } from 'vitest';
import { iconOfQuality } from './iconOfQuality';

describe('iconOfQuality', () => {
  it('reads the mark from the quality’s name', () => {
    expect(iconOfQuality('4K')).toBe(MonitorSparklesIcon);
    expect(iconOfQuality('1080p or 720p')).toBe(MonitorIcon);
    expect(iconOfQuality('SD')).toBe(SmartphoneIcon);
    expect(iconOfQuality('Any')).toBe(LayersIcon);
  });
});
