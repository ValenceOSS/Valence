import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import { createSourceCaller } from './createSourceCaller';
import type { SourceFetch } from './createSourceCaller';
import { SourceFailure } from './SourceFailure';

const Shape = z.object({ a: z.number() });

/**
 * A caller over a fake server.
 *
 * @param fetch - How the fake answers.
 * @returns The caller.
 */
const aCaller = (fetch: SourceFetch) =>
  createSourceCaller({
    fetch,
    base: 'http://source:8096/base/',
    name: 'Jellyfin',
    headers: { key: 'k' },
  });

/**
 * What a failed read said.
 *
 * @param reading - The read.
 * @returns The code of what it said.
 */
const failureOf = async (reading: Promise<object | string | null>) => {
  try {
    await reading;
  } catch (error) {
    return error instanceof SourceFailure
      ? [error.said.code, error.status]
      : ['not a source failure'];
  }

  return ['did not fail'];
};

describe('createSourceCaller', () => {
  it('reads json through its schema, on the base address with the query and the key', async () => {
    const { fetch, calls } = aFakeSourceFetch(() => ({ body: '{"a":1}' }));

    expect(await aCaller(fetch).json('/Items', Shape, { query: { x: 'y' } })).toEqual({ a: 1 });
    expect(calls[0]?.url.toString()).toBe('http://source:8096/base/Items?x=y');
    expect(calls[0]?.headers).toEqual({ key: 'k', accept: 'application/json' });
    expect(calls[0]?.method).toBe('GET');
  });

  it('asks a whole address as it is', async () => {
    const { fetch, calls } = aFakeSourceFetch(() => ({ body: 'text' }));

    expect(await aCaller(fetch).text('https://plex.tv/api/users/')).toBe('text');
    expect(calls[0]?.url.toString()).toBe('https://plex.tv/api/users/');
  });

  it('says when the source cannot be reached, or does not answer in time', async () => {
    const unreachable: SourceFetch = () => Promise.reject(new Error('refused'));
    const slow: SourceFetch = () => {
      const timeout = new Error('slow');

      timeout.name = 'TimeoutError';

      return Promise.reject(timeout);
    };

    expect(await failureOf(aCaller(unreachable).json('/x', Shape))).toEqual([
      'server.imports.sourceCaller.nameCouldNotBeReached',
      null,
    ]);
    expect(await failureOf(aCaller(slow).json('/x', Shape))).toEqual([
      'server.imports.sourceCaller.nameDidNotAnswerInTime',
      null,
    ]);
  });

  it('says when the key is refused, when the source answers badly, and when it answers in a shape it cannot read', async () => {
    const refused = aFakeSourceFetch(() => ({ status: 401, body: '' })).fetch;
    const broken = aFakeSourceFetch(() => ({ status: 500, body: '' })).fetch;
    const odd = aFakeSourceFetch(() => ({ body: '<html>' })).fetch;

    expect(await failureOf(aCaller(refused).json('/x', Shape))).toEqual([
      'server.imports.sourceCaller.nameRefusedTheKey',
      401,
    ]);
    expect(await failureOf(aCaller(broken).json('/x', Shape))).toEqual([
      'server.imports.sourceCaller.nameAnsweredStatusAtPath',
      500,
    ]);
    expect(await failureOf(aCaller(odd).json('/x', Shape))).toEqual([
      'server.imports.sourceCaller.nameAnsweredPathInAShapeValenceCannotRead',
      null,
    ]);
  });

  it('reads nothing where a path is not there, and still fails on anything worse', async () => {
    const missing = aFakeSourceFetch(() => null).fetch;
    const broken = aFakeSourceFetch(() => ({ status: 502, body: '' })).fetch;

    expect(await aCaller(missing).jsonOrNothing('/x', Shape)).toBeNull();
    expect(await failureOf(aCaller(broken).jsonOrNothing('/x', Shape))).toEqual([
      'server.imports.sourceCaller.nameAnsweredStatusAtPath',
      502,
    ]);
  });

  it('reads a picture, and nothing where the answer is not one', async () => {
    const picture = aFakeSourceFetch(() => ({ body: 'png', contentType: 'image/png' })).fetch;
    const page = aFakeSourceFetch(() => ({ body: '<html>', contentType: 'text/html' })).fetch;
    const missing = aFakeSourceFetch(() => null).fetch;

    expect(await aCaller(picture).picture('/face')).toEqual({
      body: new TextEncoder().encode('png'),
      contentType: 'image/png',
    });
    expect(await aCaller(page).picture('/face')).toBeNull();
    expect(await aCaller(missing).picture('/face')).toBeNull();
  });

  it('switches account with the one request that is not a read', async () => {
    const { fetch, calls } = aFakeSourceFetch(() => ({ body: '<user/>' }));

    expect(await aCaller(fetch).switchAccount('/switch', { query: { pin: '1234' } })).toBe(
      '<user/>',
    );
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url.searchParams.get('pin')).toBe('1234');
  });
});
