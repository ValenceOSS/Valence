import { thisPhonesId } from './thisPhonesId';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const aStore = (): DeviceStore => {
  const held = new Map<string, string>();

  return {
    read: (key) => held.get(key) ?? null,
    write: (key, value) => {
      held.set(key, value);
    },
    forget: (key) => {
      held.delete(key);
    },
  };
};

describe('thisPhonesId', () => {
  it('makes an identifier where the phone has none', () => {
    expect(thisPhonesId(aStore())).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps the same one, so closing the application is not a second device', () => {
    const store = aStore();

    expect(thisPhonesId(store)).toBe(thisPhonesId(store));
  });

  it('gives two phones different ones', () => {
    expect(thisPhonesId(aStore())).not.toBe(thisPhonesId(aStore()));
  });
});
