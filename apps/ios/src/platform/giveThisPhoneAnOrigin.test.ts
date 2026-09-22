import { giveThisPhoneAnOrigin } from './giveThisPhoneAnOrigin';
import { THE_SERVER_ADDRESS } from './THE_SERVER_ADDRESS';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

type Asked = { url: string; init: RequestInit | undefined };

const asked: Asked[] = [];

const recording = (input: string | Request | URL, init?: RequestInit): Promise<Response> => {
  asked.push({ url: input instanceof Request ? input.url : String(input), init });

  return Promise.resolve(new Response('{}'));
};

const originOf = (at: number): string | null => new Headers(asked[at]?.init?.headers).get('origin');

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

const original = globalThis.fetch;

beforeEach(() => {
  asked.length = 0;
  globalThis.fetch = recording;
});

afterEach(() => {
  globalThis.fetch = original;
});

describe('giveThisPhoneAnOrigin', () => {
  it('sends a path to the server this phone watches', async () => {
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('/api/profiles/everyone');

    expect(asked[0]?.url).toBe('http://192.168.1.36:8420/api/profiles/everyone');
  });

  it('carries what the caller asked with', async () => {
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('/api/profiles', { method: 'POST' });

    expect(asked[0]?.init).toMatchObject({ method: 'POST' });
  });

  it('keeps the headers the caller set', async () => {
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('/api/profiles', { headers: { accept: 'application/json' } });

    expect(new Headers(asked[0]?.init?.headers).get('accept')).toBe('application/json');
  });

  it('says the request came from the server, so signing out is not refused', async () => {
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('/api/auth/sign-out', { method: 'POST' });

    expect(originOf(0)).toBe('http://192.168.1.36:8420');
  });

  it('says where a request already built came from', async () => {
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    const built = new Request('http://192.168.1.36:8420/api/auth/sign-out', { method: 'POST' });

    await globalThis.fetch(built);

    expect(built.headers.get('origin')).toBe('http://192.168.1.36:8420');
  });

  it('leaves a whole address where it was aimed', async () => {
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('https://images.example/poster.jpg');

    expect(asked[0]?.url).toBe('https://images.example/poster.jpg');
  });

  it('tells nothing aimed elsewhere where it came from', async () => {
    giveThisPhoneAnOrigin(aStore('http://192.168.1.36:8420'));

    await globalThis.fetch('https://images.example/poster.jpg');

    expect(originOf(0)).toBeNull();
  });

  it('asks again each time, so a different server is watched without a restart', async () => {
    const store = aStore('http://one.local:8420');

    giveThisPhoneAnOrigin(store);

    await globalThis.fetch('/api/health');
    store.write(THE_SERVER_ADDRESS, 'http://two.local:8420');
    await globalThis.fetch('/api/health');

    expect(asked[0]?.url).toBe('http://one.local:8420/api/health');
    expect(asked[1]?.url).toBe('http://two.local:8420/api/health');
  });

  it('leaves a path alone before anybody has said where the server is', async () => {
    giveThisPhoneAnOrigin(aStore(null));

    await globalThis.fetch('/api/health');

    expect(asked[0]?.url).toBe('/api/health');
  });
});
