import { PLACEHOLDER } from '@ValenceClient/session/askTheServer';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import {
  atTheServer,
  pointFetchAtTheServer,
  withTheSession,
} from '@ValenceTv/platform/pointFetchAtTheServer';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('atTheServer', () => {
  it('puts Valence paths on the server', () => {
    rememberServerAddress('http://valence.local:3000');

    expect(atTheServer('/api/profiles')).toBe('http://valence.local:3000/api/profiles');
  });

  it('moves what the auth library built on its placeholder onto the server', () => {
    rememberServerAddress('http://valence.local:3000');

    expect(atTheServer(`${PLACEHOLDER}/api/auth/sign-out`)).toBe(
      'http://valence.local:3000/api/auth/sign-out',
    );
  });

  it('leaves the bundler its own paths', () => {
    rememberServerAddress('http://valence.local:3000');

    expect(atTheServer('/symbolicate')).toBe('/symbolicate');
  });

  it('leaves a path as it is before there is a server', () => {
    expect(atTheServer('/api/profiles')).toBe('/api/profiles');
  });
});

describe('withTheSession', () => {
  it('signs the request and says it comes from the server', () => {
    rememberServerAddress('http://valence.local:3000');
    keepTheSessionToken('secret');

    const headers = withTheSession({ accept: 'application/json' });

    expect(headers.get('authorization')).toBe('Bearer secret');
    expect(headers.get('origin')).toBe('http://valence.local:3000');
    expect(headers.get('accept')).toBe('application/json');
  });

  it('keeps who a request already says it is', () => {
    rememberServerAddress('http://valence.local:3000');
    keepTheSessionToken('secret');

    const headers = withTheSession({ authorization: 'Bearer other', origin: 'http://elsewhere' });

    expect(headers.get('authorization')).toBe('Bearer other');
    expect(headers.get('origin')).toBe('http://elsewhere');
  });

  it('adds nothing where nobody is signed in and there is no server', () => {
    const headers = withTheSession(undefined);

    expect(headers.has('authorization')).toBe(false);
    expect(headers.has('origin')).toBe(false);
  });
});

describe('pointFetchAtTheServer', () => {
  it('sends a path to the server, signed', async () => {
    const sent = jest.fn<Promise<Response>, [string | URL | Request, RequestInit | undefined]>(() =>
      Promise.resolve(new Response('{}')),
    );

    globalThis.fetch = sent;
    rememberServerAddress('http://valence.local:3000');
    keepTheSessionToken('secret');
    pointFetchAtTheServer();

    await fetch('/api/profiles', { method: 'POST', body: 'x' });

    const [input, init] = sent.mock.calls[0] ?? [];

    expect(input).toBe('http://valence.local:3000/api/profiles');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer secret');
  });

  it('rebuilds a request that arrives already made on the server', async () => {
    const sent = jest.fn<Promise<Response>, [string | URL | Request, RequestInit | undefined]>(() =>
      Promise.resolve(new Response('{}')),
    );

    globalThis.fetch = sent;
    rememberServerAddress('http://valence.local:3000');
    keepTheSessionToken('secret');
    pointFetchAtTheServer();

    await fetch(new Request(`${PLACEHOLDER}/api/auth/sign-out`, { method: 'POST' }));

    const [input] = sent.mock.calls[0] ?? [];

    expect(input).toBeInstanceOf(Request);

    if (input instanceof Request) {
      expect(input.url).toBe('http://valence.local:3000/api/auth/sign-out');
      expect(input.method).toBe('POST');
      expect(input.headers.get('authorization')).toBe('Bearer secret');
      expect(input.headers.get('origin')).toBe('http://valence.local:3000');
    }
  });
});
