import { giveThisPhoneAnOrigin } from './giveThisPhoneAnOrigin';
import { THE_SERVER_ADDRESS } from './THE_SERVER_ADDRESS';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const aStore = (address: string | null): DeviceStore => {
  const held = new Map(address === null ? [] : [[THE_SERVER_ADDRESS, address]]);

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

describe('giveThisPhoneAnOrigin', () => {
  const original = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = original;
  });

  it('sends a path to the server this phone watches', async () => {
    const asked = jest.fn().mockResolvedValue(new Response('{}'));

    globalThis.fetch = asked;
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('/api/profiles/everyone');

    expect(asked).toHaveBeenCalledWith('http://192.168.1.36:8420/api/profiles/everyone', undefined);
  });

  it('carries what the caller asked with', async () => {
    const asked = jest.fn().mockResolvedValue(new Response('{}'));

    globalThis.fetch = asked;
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('/api/profiles', { method: 'POST' });

    expect(asked).toHaveBeenCalledWith(expect.any(String), { method: 'POST' });
  });

  it('leaves a whole address where it was aimed', async () => {
    const asked = jest.fn().mockResolvedValue(new Response('{}'));

    globalThis.fetch = asked;
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('https://images.example/poster.jpg');

    expect(asked).toHaveBeenCalledWith('https://images.example/poster.jpg', undefined);
  });

  it('asks again each time, so a different server is watched without a restart', async () => {
    const asked = jest.fn().mockResolvedValue(new Response('{}'));
    const store = aStore('http://one.local:8420');

    globalThis.fetch = asked;
    giveThisPhoneAnOrigin(store);

    await globalThis.fetch('/api/health');
    store.write(THE_SERVER_ADDRESS, 'http://two.local:8420');
    await globalThis.fetch('/api/health');

    expect(asked).toHaveBeenNthCalledWith(1, 'http://one.local:8420/api/health', undefined);
    expect(asked).toHaveBeenNthCalledWith(2, 'http://two.local:8420/api/health', undefined);
  });

  it('leaves a path alone before anybody has said where the server is', async () => {
    const asked = jest.fn().mockResolvedValue(new Response('{}'));

    globalThis.fetch = asked;
    giveThisPhoneAnOrigin(aStore(null));

    await globalThis.fetch('/api/health');

    expect(asked).toHaveBeenCalledWith('/api/health', undefined);
  });
});
