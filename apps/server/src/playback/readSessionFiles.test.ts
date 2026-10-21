import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readSessionFiles } from './readSessionFiles';
import type * as FilePromises from 'node:fs/promises';

const handles = vi.hoisted(() => ({ opened: 0, closed: 0 }));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof FilePromises>();

  return {
    ...actual,
    open: async (...asked: Parameters<typeof actual.open>) => {
      const handle = await actual.open(...asked);
      const close = handle.close.bind(handle);

      handles.opened += 1;
      handle.close = async () => {
        handles.closed += 1;
        await close();
      };

      return handle;
    },
  };
});

beforeEach(() => {
  handles.opened = 0;
  handles.closed = 0;
});

/**
 * Writes the pieces of a segment to read back.
 *
 * @param contents - What each piece holds.
 * @returns Where they are, in order.
 */
const piecesOf = async (contents: readonly string[]): Promise<string[]> => {
  const directory = await mkdtemp(join(tmpdir(), 'valence-session-'));

  return Promise.all(
    contents.map(async (content, at) => {
      const path = join(directory, `segment_${at.toString()}.m4s`);

      await writeFile(path, content);

      return path;
    }),
  );
};

describe('readSessionFiles', () => {
  it('sends the pieces of a segment one after another, as one response', async () => {
    const paths = await piecesOf(['first-', 'second-', 'third']);
    const file = await readSessionFiles(paths, 'video/mp4');

    expect(file?.status).toBe(200);
    expect(file?.contentType).toBe('video/mp4');
    expect(file?.contentLength).toBe('18');
    expect(await new Response(file?.body).text()).toBe('first-second-third');
  });

  it('sends a piece larger than one read whole', async () => {
    const [path = ''] = await piecesOf(['x'.repeat(2 * 1024 * 1024 + 3)]);
    const file = await readSessionFiles([path], 'video/mp4');

    expect((await new Response(file?.body).arrayBuffer()).byteLength).toBe(2 * 1024 * 1024 + 3);
  });

  it('leaves a segment it cannot open to the media service', async () => {
    const [path = ''] = await piecesOf(['here']);

    expect(await readSessionFiles([path, '/nowhere/segment.m4s'], 'video/mp4')).toBeNull();
  });

  it('opens nothing until the response is read, so one never sent holds nothing open', async () => {
    const paths = await piecesOf(['first-', 'second']);

    await readSessionFiles(paths, 'video/mp4');

    expect(handles.opened).toBe(0);
  });

  it('closes every file it opened once the response is read through', async () => {
    const paths = await piecesOf(['first-', 'second-', 'third']);

    await new Response((await readSessionFiles(paths, 'video/mp4'))?.body).text();

    expect(handles).toEqual({ opened: 3, closed: 3 });
  });

  it('closes the file it is reading when the player goes', async () => {
    const [path = ''] = await piecesOf(['x'.repeat(3 * 1024 * 1024)]);
    const reader = (await readSessionFiles([path], 'video/mp4'))?.body.getReader();

    await reader?.read();
    await reader?.cancel();

    expect(handles).toEqual({ opened: 1, closed: 1 });
  });

  it('closes the file and fails the response where a piece has gone before it is read', async () => {
    const paths = await piecesOf(['first-', 'second']);
    const file = await readSessionFiles(paths, 'video/mp4');

    await rm(paths[1] ?? '');

    await expect(new Response(file?.body).text()).rejects.toThrow();
    expect(handles.opened).toBe(handles.closed);
  });
});
