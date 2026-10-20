import { describe, expect, it } from 'vitest';
import { areDeviceChoicesChanged } from './areDeviceChoicesChanged';
import { readDeviceChoices } from './readDeviceChoices';

const WAS = readDeviceChoices();

describe('areDeviceChoicesChanged', () => {
  it('finds nothing changed in what the device used as the editor opened', () => {
    expect(areDeviceChoicesChanged({ ...WAS, deviceWas: WAS })).toBe(false);
  });

  it('finds any one choice changed on its own', () => {
    expect(areDeviceChoicesChanged({ ...WAS, connections: 1, deviceWas: WAS })).toBe(true);
    expect(areDeviceChoicesChanged({ ...WAS, pluginTheme: 'a/b', deviceWas: WAS })).toBe(true);
  });
});
