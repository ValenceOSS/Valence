import {
  Cast as CastIcon,
  Compass as CompassIcon,
  Globe as GlobeIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import { describe, expect, it } from 'vitest';
import { deviceIconFor } from './deviceIcon';
describe('deviceIconFor', () => {
  it('picks the browser a label starts with', () => {
    expect(deviceIconFor('Chromium on macOS')).toBe(GlobeIcon);
  });

  it('tells one browser apart from another', () => {
    expect(deviceIconFor('Firefox on Linux')).toBe(GlobeIcon);
  });

  it('gives Safari its own mark, the one browser the set can still draw honestly', () => {
    expect(deviceIconFor('Safari on iOS')).toBe(CompassIcon);
  });

  it('falls back to a plain device icon for a label it does not recognise', () => {
    expect(deviceIconFor('Unknown device')).toBe(MonitorIcon);
  });

  it('draws a phone as a phone, whatever its owner called it', () => {
    expect(deviceIconFor('Dan\u2019s iPhone', 'phone')).toBe(SmartphoneIcon);
  });

  it('draws a television as something being cast to', () => {
    expect(deviceIconFor('Living room', 'tv')).toBe(CastIcon);
  });

  it('draws the desktop application as a machine, not as a browser', () => {
    expect(deviceIconFor('Valence on macOS', 'desktop')).toBe(MonitorIcon);
  });

  it('reads the label only for a browser, where the kind says nothing more', () => {
    expect(deviceIconFor('Firefox on Windows', 'browser')).toBe(GlobeIcon);
  });

  it('takes a client that says nothing for a browser, as every client was before any said', () => {
    expect(deviceIconFor('Chrome on macOS')).toBe(GlobeIcon);
  });

  it('does not read a phone\u2019s name as a browser it happens to start with', () => {
    expect(deviceIconFor('Operations iPhone', 'phone')).toBe(SmartphoneIcon);
  });
});
