import { theServerThisPhoneWatches } from './theServerThisPhoneWatches';
import { THE_SERVER_ADDRESS } from './THE_SERVER_ADDRESS';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const aStore = (held: Map<string, string>): DeviceStore => ({
  read: (key) => held.get(key) ?? null,
  write: (key, value) => {
    held.set(key, value);
  },
  forget: (key) => {
    held.delete(key);
  },
});

describe('theServerThisPhoneWatches', () => {
  it('reads the address somebody gave', () => {
    const held = new Map([[THE_SERVER_ADDRESS, 'http://192.168.1.36:8420']]);

    expect(theServerThisPhoneWatches(aStore(held))).toBe('http://192.168.1.36:8420');
  });

  it('answers nothing before anybody has said', () => {
    expect(theServerThisPhoneWatches(aStore(new Map()))).toBeNull();
  });
});
