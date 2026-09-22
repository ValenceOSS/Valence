import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLACEHOLDER, askTheServer, theAuthBase } from './askTheServer';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';

const fetchMock = vi.fn<(input: string | Request, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('askTheServer', () => {
  it('asks the page its own origin, which is where every Valence client is served from', async () => {
    await askTheServer('/api/auth/get-session');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/get-session');
  });

  it('keeps what the caller asked with, rather than rebuilding the request', async () => {
    await askTheServer('/api/auth/sign-out', { method: 'POST' });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('reads the global when it is asked, not when the client was built', async () => {
    const second = vi.fn<() => Promise<Response>>(() => Promise.resolve(new Response('{}')));

    vi.stubGlobal('fetch', second);

    await askTheServer('/api/auth/get-session');

    expect(second).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks with a string where the library asked with a URL, which a caller may be expecting', async () => {
    await askTheServer(new URL('http://localhost/api/auth/get-session'));

    expect(typeof fetchMock.mock.calls[0]?.[0]).toBe('string');
  });
});

describe('theAuthBase', () => {
  it('hands a browser its own origin, which the library is happy with', () => {
    vi.stubGlobal('location', { protocol: 'https:', origin: 'https://valence.example' });

    expect(theAuthBase()).toBe('https://valence.example');
  });

  it('hands a client that serves its own pages a base the library will accept', () => {
    vi.stubGlobal('location', { protocol: 'valence:', origin: 'valence://app' });

    expect(theAuthBase()).toBe(PLACEHOLDER);
  });
});

describe('a request that arrives already built', () => {
  it('is rebuilt where it carries a host that does not resolve', async () => {
    await askTheServer(new Request(`${PLACEHOLDER}/api/auth/get-session`));

    const [sent] = fetchMock.mock.calls[0] ?? [];
    const asked = sent instanceof Request ? sent.url : String(sent);

    expect(asked).not.toContain('valence.invalid');
  });

  it('is left alone where it is already asking for somewhere real', async () => {
    const built = new Request('http://localhost:8420/api/auth/get-session');

    await askTheServer(built);

    expect(fetchMock).toHaveBeenCalledWith(built, undefined);
  });
});

describe('a client that was not served by its Valence', () => {
  afterEach(() => {
    forgetPlatform();
  });

  it('sends a path to the server it was told about, having no page to resolve against', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));

    await askTheServer('/api/profiles/everyone');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://192.168.1.36:8420/api/profiles/everyone');
  });

  it('rebuilds what the library built on the placeholder onto that server', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));

    await askTheServer(new Request(`${PLACEHOLDER}/api/auth/get-session`));

    const asked = fetchMock.mock.calls[0]?.[0];

    expect(asked instanceof Request ? asked.url : String(asked)).toBe(
      'http://192.168.1.36:8420/api/auth/get-session',
    );
  });

  it('asks again each time, so a different server is asked without a restart', async () => {
    let address = 'http://one.local:8420';

    installPlatform(aFakePlatform({ serverAddress: () => address }));

    await askTheServer('/api/health');
    address = 'http://two.local:8420';
    await askTheServer('/api/health');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://one.local:8420/api/health');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://two.local:8420/api/health');
  });

  it('leaves a whole address alone, wherever it was aimed', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));

    await askTheServer('https://images.example/poster.jpg');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://images.example/poster.jpg');
  });

  it('leaves a client that was served by its Valence asking as it always did', async () => {
    installPlatform(aFakePlatform());

    await askTheServer('/api/profiles/everyone');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/profiles/everyone');
  });

  it('manages before any client has said what it is', async () => {
    await askTheServer('/api/health');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/health');
  });
});
