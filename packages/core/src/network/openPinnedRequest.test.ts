import { createServer, request } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { text } from 'node:stream/consumers';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openPinnedRequest } from './openPinnedRequest';
import type { OpenPinnedRequestOptions, PinnedAnswer } from './openPinnedRequest';
import { PinnedRequestRefusal } from './PinnedRequestRefusal';

type Handler = (asked: IncomingMessage, answer: ServerResponse) => void;

let server: Server;
let port = 0;
let handle: Handler = (_asked, answer) => {
  answer.end('ok');
};

beforeEach(async () => {
  server = createServer((asked, answer) => {
    handle(asked, answer);
  });
  await new Promise<void>((ready) => {
    server.listen(0, '127.0.0.1', () => {
      ready();
    });
  });
  const address = server.address();

  port = typeof address === 'object' && address !== null ? address.port : 0;
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((done) => {
    server.close(() => {
      done();
    });
  });
});

const optionsFor = (changes: Partial<OpenPinnedRequestOptions> = {}): OpenPinnedRequestOptions => ({
  hosts: ['api.example.com', '*.files.example.com'],
  userAgent: 'Valence-Test',
  transport: (options, onResponse) => request({ ...options, port }, onResponse),
  resolver: (_hostname, answer) => {
    answer(null, [{ address: '127.0.0.1', family: 4 }]);
  },
  isAllowedAddress: (address) => address === '127.0.0.1',
  ...changes,
});

const reasonOf = async (opening: Promise<PinnedAnswer>): Promise<string> => {
  try {
    await opening;

    return 'opened';
  } catch (error) {
    return error instanceof PinnedRequestRefusal ? error.reason : 'other';
  }
};

describe('opening a request pinned to public addresses', () => {
  it('opens a listed host, and leaves the body for the caller to stream', async () => {
    let heard: IncomingMessage['headers'] = {};

    handle = (asked, answer) => {
      heard = asked.headers;
      answer.setHeader('set-cookie', 'session=secret');
      answer.writeHead(206, { 'content-range': 'bytes 4-7/8' });
      answer.end('5678');
    };

    const answer = await openPinnedRequest(
      'https://eu1.files.example.com/file?token=1',
      { headers: { Range: 'bytes=4-', Cookie: 'stolen=1' } },
      optionsFor(),
    );

    expect(answer.status).toBe(206);
    expect(answer.headers['content-range']).toBe('bytes 4-7/8');
    expect(answer.headers['set-cookie']).toBeUndefined();
    expect(answer.url.hostname).toBe('eu1.files.example.com');
    expect(await text(answer.body)).toBe('5678');
    expect(heard.range).toBe('bytes=4-');
    expect(heard.cookie).toBeUndefined();
    expect(heard['user-agent']).toBe('Valence-Test');
  });

  it.each([
    ['http://api.example.com/', 'notHttps'],
    ['not an address', 'notHttps'],
    ['https://user:pass@api.example.com/', 'credentials'],
    ['https://api.example.com:8443/', 'port'],
    ['https://elsewhere.example.com/', 'host'],
    ['https://files.example.com/', 'host'],
  ])('refuses %s', async (address, reason) => {
    expect(await reasonOf(openPinnedRequest(address, {}, optionsFor()))).toBe(reason);
  });

  it('refuses a name that resolves anywhere private, even alongside a public address', async () => {
    const opening = openPinnedRequest(
      'https://api.example.com/',
      {},
      optionsFor({
        resolver: (_hostname, answer) => {
          answer(null, [
            { address: '127.0.0.1', family: 4 },
            { address: '10.0.0.5', family: 4 },
          ]);
        },
      }),
    );

    expect(await reasonOf(opening)).toBe('resolvesPrivately');
  });

  it('refuses an address written as a private number, at the start or after a redirect', async () => {
    handle = (_asked, answer) => {
      answer.writeHead(302, { location: 'https://0xa.0.0.5/' });
      answer.end();
    };

    for (const address of ['https://0x7f.1/', 'https://[::1]/', 'https://10.0.0.5/']) {
      expect(
        await reasonOf(
          openPinnedRequest(
            address,
            {},
            optionsFor({ hosts: 'any', isAllowedAddress: () => false }),
          ),
        ),
      ).toBe('resolvesPrivately');
    }

    expect(
      await reasonOf(
        openPinnedRequest('https://api.example.com/start', {}, optionsFor({ hosts: 'any' })),
      ),
    ).toBe('resolvesPrivately');
  });

  it('follows a redirect to a listed host and refuses one to a host that is not', async () => {
    handle = (asked, answer) => {
      if (asked.url === '/start') {
        answer.writeHead(302, { location: 'https://cdn.files.example.com/done' });
        answer.end();

        return;
      }

      if (asked.url === '/away') {
        answer.writeHead(302, { location: 'https://evil.example.net/' });
        answer.end();

        return;
      }

      answer.end(asked.headers.host ?? '');
    };

    const followed = await openPinnedRequest('https://api.example.com/start', {}, optionsFor());

    expect(await text(followed.body)).toBe(`cdn.files.example.com:${port.toString()}`);
    expect(
      await reasonOf(openPinnedRequest('https://api.example.com/away', {}, optionsFor())),
    ).toBe('host');
  });

  it('gives up after too many redirects', async () => {
    handle = (_asked, answer) => {
      answer.writeHead(307, { location: '/again' });
      answer.end();
    };

    expect(await reasonOf(openPinnedRequest('https://api.example.com/', {}, optionsFor()))).toBe(
      'redirects',
    );
  });

  it('gives up when nothing arrives for a while', async () => {
    handle = () => undefined;

    expect(
      await reasonOf(
        openPinnedRequest('https://api.example.com/', {}, optionsFor({ idleMilliseconds: 100 })),
      ),
    ).toBe('slow');
  });

  it('sends a developer’s stand-in host to where it really is, over http and past the address check', async () => {
    let asked: { hostname: string | null | undefined; port: string | number | null | undefined } = {
      hostname: null,
      port: null,
    };

    handle = (_asked, answer) => {
      answer.end('stand-in');
    };

    const answer = await openPinnedRequest(
      'https://api.example.com/',
      {},
      optionsFor({
        isAllowedAddress: () => false,
        devHosts: new Map([['api.example.com', { address: '127.0.0.1', port: 9 }]]),
        transport: () => {
          throw new Error('A stand-in host is not reached over https');
        },
        devTransport: (options, onResponse) => {
          asked = { hostname: options.hostname, port: options.port };

          return request({ ...options, port }, onResponse);
        },
      }),
    );

    expect(await text(answer.body)).toBe('stand-in');
    expect(asked).toEqual({ hostname: 'api.example.com', port: 9 });
  });
});
