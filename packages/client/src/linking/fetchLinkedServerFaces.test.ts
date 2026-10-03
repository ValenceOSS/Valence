import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { fetchLinkedServerFaces } from './fetchLinkedServerFaces';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLinkedServerFaces', () => {
  it('reads the servers this one is linked with', async () => {
    const asked = aServerAnswering({ servers: [aLinkedServerFace()] });

    expect(await fetchLinkedServerFaces()).toEqual([aLinkedServerFace()]);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/faces');
  });
});
