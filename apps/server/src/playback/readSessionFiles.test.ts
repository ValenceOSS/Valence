import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readSessionFiles } from './readSessionFiles';

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
});
