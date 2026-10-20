import { afterEach, describe, expect, it } from 'vitest';
import { areDeviceChoicesChanged } from './areDeviceChoicesChanged';
import { readDeviceChoices } from './readDeviceChoices';

afterEach(() => {
  window.localStorage.clear();
});

describe('areDeviceChoicesChanged', () => {
  it('finds nothing changed in what this device already uses', () => {
    expect(areDeviceChoicesChanged(readDeviceChoices())).toBe(false);
  });

  it('finds any one choice changed on its own', () => {
    expect(areDeviceChoicesChanged({ ...readDeviceChoices(), connections: 1 })).toBe(true);
    expect(areDeviceChoicesChanged({ ...readDeviceChoices(), pluginTheme: 'a/b' })).toBe(true);
  });
});
