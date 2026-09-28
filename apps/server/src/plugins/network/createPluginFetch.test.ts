import { createServer, request } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPluginFetch } from './createPluginFetch';
import { isPublicAddress } from './isPublicAddress';

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
  await new Promise<void>((done) => {
    server.close(() => {
      done();
    });
  });
});

const bothFor = (overrides: Partial<Parameters<typeof createPluginFetch>[0]> = {}) =>
  createPluginFetch({
    pluginId: 'test-plugin',
    hosts: ['api.example.com', 'second.example.com'],
    transport: (options, onResponse) => request({ ...options, port }, onResponse),
    resolver: (_hostname, answer) => {
      answer(null, [{ address: '127.0.0.1', family: 4 }]);
    },
    isAllowedAddress: (address) => address === '127.0.0.1',
    ...overrides,
  });

const fetchFor = (overrides: Partial<Parameters<typeof createPluginFetch>[0]> = {}) =>
  bothFor(overrides).fetch;

describe('how a plugin reaches the internet', () => {
  it('fetches from an allowed host, sends nothing of the server, and drops cookies', async () => {
    let heard: IncomingMessage['headers'] = {};

    handle = (asked, answer) => {
      heard = asked.headers;
      answer.setHeader('set-cookie', 'session=secret');
      answer.setHeader('x-kind', 'test');
      answer.end(`${asked.method ?? ''} ${asked.url ?? ''}`);
    };

    const answer = await fetchFor()('https://api.example.com/v1/list?page=2', {
      headers: { Authorization: 'Bearer token', Cookie: 'stolen=1', 'X-Forwarded-For': '1.2.3.4' },
    });

    expect(answer).toMatchObject({ status: 200, text: 'GET /v1/list?page=2' });
    expect(answer.headers['x-kind']).toBe('test');
    expect(answer.headers['set-cookie']).toBeUndefined();
    expect(heard['user-agent']).toBe('Valence-Plugin/test-plugin');
    expect(heard.authorization).toBe('Bearer token');
    expect(heard.cookie).toBeUndefined();
    expect(heard['x-forwarded-for']).toBeUndefined();
  });

  it('posts a body', async () => {
    handle = (asked, answer) => {
      let body = '';

      asked.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      asked.on('end', () => {
        answer.end(`${asked.method ?? ''}:${body}`);
      });
    };

    const answer = await fetchFor()('https://api.example.com/graphql', {
      method: 'POST',
      body: '{"query":"x"}',
    });

    expect(answer.text).toBe('POST:{"query":"x"}');
  });

  it.each([
    ['http://api.example.com/', 'only fetch https'],
    ['https://elsewhere.example.com/', 'may not reach elsewhere.example.com'],
    ['https://api.example.com:8443/', 'standard port'],
    ['https://user:pass@api.example.com/', 'credentials'],
    ['not a url', 'only fetch https'],
    ['https://metadata.google.internal/', 'may not reach'],
  ])('refuses %s', async (address, refusal) => {
    await expect(fetchFor()(address)).rejects.toThrow(refusal);
  });

  it('reaches any public host when told any, and still refuses what is not https or is metadata', async () => {
    const anywhere = fetchFor({ hosts: 'any' });

    await expect(anywhere('https://elsewhere.example.com/catalogue.json')).resolves.toMatchObject({
      status: 200,
    });
    await expect(anywhere('http://elsewhere.example.com/')).rejects.toThrow('only fetch https');
    await expect(anywhere('https://metadata.google.internal/')).rejects.toThrow('may not reach');
  });

  it('refuses a host that resolves to a private address', async () => {
    const fetch = fetchFor({
      resolver: (_hostname, answer) => {
        answer(null, [{ address: '10.0.0.5', family: 4 }]);
      },
      isAllowedAddress: isPublicAddress,
    });

    await expect(fetch('https://api.example.com/')).rejects.toThrow(
      'resolves somewhere a plugin may not reach',
    );
  });

  it('refuses a host that resolves to a public and a private address', async () => {
    const fetch = fetchFor({
      resolver: (_hostname, answer) => {
        answer(null, [
          { address: '127.0.0.1', family: 4 },
          { address: '192.168.1.1', family: 4 },
        ]);
      },
    });

    await expect(fetch('https://api.example.com/')).rejects.toThrow('resolves somewhere');
  });

  it('passes on a name that does not resolve', async () => {
    const fetch = fetchFor({
      resolver: (_hostname, answer) => {
        answer(new Error('ENOTFOUND'), []);
      },
    });

    await expect(fetch('https://api.example.com/')).rejects.toThrow('ENOTFOUND');
  });

  it('follows a redirect to another allowed host, and turns a 303 into a GET', async () => {
    handle = (asked, answer) => {
      if (asked.url === '/start') {
        answer.writeHead(303, { location: 'https://second.example.com/done' });
        answer.end();

        return;
      }

      answer.end(`${asked.method ?? ''} ${asked.headers.host ?? ''}${asked.url ?? ''}`);
    };

    const answer = await fetchFor()('https://api.example.com/start', { method: 'POST', body: 'x' });

    expect(answer.text).toBe(`GET second.example.com:${port.toString()}/done`);
  });

  it('refuses a redirect to a host it may not reach', async () => {
    handle = (_asked, answer) => {
      answer.writeHead(302, { location: 'https://evil.example.net/' });
      answer.end();
    };

    await expect(fetchFor()('https://api.example.com/')).rejects.toThrow(
      'may not reach evil.example.net',
    );
  });

  it('gives up after too many redirects', async () => {
    handle = (_asked, answer) => {
      answer.writeHead(307, { location: '/again' });
      answer.end();
    };

    await expect(fetchFor()('https://api.example.com/')).rejects.toThrow(
      'redirected too many times',
    );
  });

  it('stops reading an answer that is too large', async () => {
    handle = (_asked, answer) => {
      answer.end('x'.repeat(2048));
    };

    await expect(fetchFor({ mostBytes: 1024 })('https://api.example.com/')).rejects.toThrow(
      'larger than',
    );
  });

  it('gives up on an answer that is too slow', async () => {
    handle = () => undefined;

    await expect(
      fetchFor({ timeoutMilliseconds: 100 })('https://api.example.com/'),
    ).rejects.toThrow('too long');
  });

  it('answers bytes for a picture', async () => {
    handle = (_asked, answer) => {
      answer.setHeader('content-type', 'image/png');
      answer.end(Buffer.from([137, 80, 78, 71]));
    };

    const answer = await bothFor().fetchBytes('https://api.example.com/cover.png');

    expect(answer.headers['content-type']).toBe('image/png');
    expect([...answer.body]).toEqual([137, 80, 78, 71]);
  });

  it('keeps a header value from smuggling another header', async () => {
    let heard: IncomingMessage['headers'] = {};

    handle = (asked, answer) => {
      heard = asked.headers;
      answer.end('ok');
    };

    await fetchFor()('https://api.example.com/', {
      headers: { 'X-Test': 'fine', 'X-Bad': 'a\r\nInjected: yes' },
    });

    expect(heard['x-test']).toBe('fine');
    expect(heard['x-bad']).toBeUndefined();
    expect(heard.injected).toBeUndefined();
  });
});
