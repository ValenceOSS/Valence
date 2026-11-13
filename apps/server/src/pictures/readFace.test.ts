import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readFace } from './readFace';

const aFolderWith = async (files: Record<string, string>) => {
  const directory = await mkdtemp(join(tmpdir(), 'valence-faces-'));

  for (const [path, body] of Object.entries(files)) {
    await mkdir(join(directory, path, '..'), { recursive: true });
    await writeFile(join(directory, path), body);
  }

  return directory;
};

describe('readFace', () => {
  it('reads the processed picture, never the original', async () => {
    const directory = await aFolderWith({
      'originals/p1.png': 'original',
      'processed/p1.webp': 'processed',
    });
    const face = await readFace(directory, 'p1.png', false);

    expect(face?.contentType).toBe('image/webp');
    expect(new TextDecoder().decode(face?.body)).toBe('processed');
  });

  it('reads the framed square for an app that asks for it', async () => {
    const directory = await aFolderWith({
      'processed/p1.webp': 'whole',
      'processed/p1.framed.webp': 'framed',
    });

    expect(new TextDecoder().decode((await readFace(directory, 'p1.png', true))?.body)).toBe(
      'framed',
    );
  });

  it('reads nothing where only the original is kept', async () => {
    const directory = await aFolderWith({ 'originals/p1.png': 'original', 'p1.png': 'loose' });

    await expect(readFace(directory, 'p1.png', false)).resolves.toBeNull();
  });

  it('reads a moving face as it came, since nothing processes it', async () => {
    const directory = await aFolderWith({ 'originals/p1.mp4': 'moving' });

    expect((await readFace(directory, 'p1.mp4', true))?.contentType).toBe('video/mp4');
  });
});
