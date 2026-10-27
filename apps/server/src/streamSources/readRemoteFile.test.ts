import { createServer, request } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OpenPinnedRequestOptions } from '@ValenceCore/network/openPinnedRequest';
import { readRemoteFile } from './readRemoteFile';

let server: Server;
let port = 0;
let handle: (asked: IncomingMessage, answer: ServerResponse) => void;

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

const SEAMS: Pick<OpenPinnedRequestOptions, 'transport' | 'resolver' | 'isAllowedAddress'> = {
  transport: (options, onResponse) => request({ ...options, port }, onResponse),
  resolver: (_hostname, answer) => {
    answer(null, [{ address: '127.0.0.1', family: 4 }]);
  },
  isAllowedAddress: (address) => address === '127.0.0.1',
};

const FETCHED = {
  url: 'https://eu1.files.example.test/f/abc',
  hosts: ['*.files.example.test'],
  fileName: 'film.mkv',
};

describe('reading a streamed film’s file from its source', () => {
  it('passes a range through, and hands the file on as it arrives', async () => {
    let asked: string | undefined;

    handle = (incoming, answer) => {
      asked = incoming.headers.range;
      answer.writeHead(206, { 'content-range': 'bytes 2-5/10', 'content-length': '4' });
      answer.end('2345');
    };

    const read = await readRemoteFile(FETCHED, 'bytes=2-5', SEAMS);

    if (read === null || read === 'expired') {
      throw new Error('It was not read.');
    }

    expect(asked).toBe('bytes=2-5');
    expect(read).toMatchObject({
      status: 206,
      contentType: 'application/octet-stream',
      contentRange: 'bytes 2-5/10',
      contentLength: '4',
    });
    expect(await new Response(read.body).text()).toBe('2345');
  });

  it('says a link that no longer works has expired, and gives nothing for any other failure', async () => {
    handle = (_incoming, answer) => {
      answer.writeHead(410);
      answer.end();
    };

    expect(await readRemoteFile(FETCHED, null, SEAMS)).toBe('expired');

    handle = (_incoming, answer) => {
      answer.writeHead(500);
      answer.end();
    };

    expect(await readRemoteFile(FETCHED, null, SEAMS)).toBeNull();
  });

  it('refuses a link to a host the plugin did not list', async () => {
    await expect(
      readRemoteFile({ ...FETCHED, url: 'https://elsewhere.example.com/f' }, null, SEAMS),
    ).rejects.toThrow();
  });
});
