import { describe, expect, it, vi } from 'vitest';
import type { ResolveAnswer } from '@ValenceSDK/sources/ResolveAnswerSchema';
import { StreamRefusal } from './StreamRefusal';
import { createStreamedLinks } from './createStreamedLinks';

const TITLE = {
  kind: 'film',
  catalogueId: '603',
  tmdbId: '603',
  imdbId: null,
  title: 'A film',
  year: 1999,
} as const;

const CHOICE = {
  mediaItemId: 'm1',
  pluginId: 'example-files',
  sourceId: 'files',
  streamKey: 'a',
  name: 'Film.1999.1080p',
  infoHash: null,
  fileName: 'film.mkv',
  sizeBytes: 10,
};

const ready = (url: string, expiresAt: string | null = null): ResolveAnswer => ({
  kind: 'ready',
  url,
  fileName: 'film.mkv',
  sizeBytes: 10,
  expiresAt,
});

const build = (answers: ResolveAnswer[], clock = { at: 0 }, expired = false) => {
  const resolve = vi.fn(() =>
    Promise.resolve(answers.shift() ?? ready('https://x.files.example.test/z')),
  );
  const register = vi.fn(() => Promise.resolve());

  return {
    resolve,
    register,
    links: createStreamedLinks({
      choiceOf: (id) => Promise.resolve(id === 'm1' ? CHOICE : null),
      pathOf: (id) => Promise.resolve(id === 'm1' ? 'streamed://film/603' : null),
      titleOf: () => Promise.resolve(TITLE),
      source: () => ({ resolve }),
      sourceNameOf: () => Promise.resolve('Example files'),
      linkHostsOf: () => Promise.resolve(['*.files.example.test']),
      register,
      hasExpired: () => Promise.resolve(expired),
      now: () => clock.at,
    }),
  };
};

describe('where each streamed film is fetched from now', () => {
  it('asks the film’s source for a link, registers it, and keeps it while it lasts', async () => {
    const { links, resolve, register } = build([ready('https://eu1.files.example.test/a')]);
    const link = await links.linkFor('m1');

    expect(link).toMatchObject({
      url: 'https://eu1.files.example.test/a',
      hosts: ['*.files.example.test'],
    });
    expect(link.key).toMatch(/^streamed-/);
    expect(register).toHaveBeenCalledWith(link.key, {
      url: 'https://eu1.files.example.test/a',
      hosts: ['*.files.example.test'],
      sizeBytes: 10,
    });
    expect(await links.linkFor('m1')).toBe(link);
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('asks again shortly before a link expires, and when told it is stale', async () => {
    const clock = { at: 0 };
    const { links, resolve } = build(
      [ready('https://eu1.files.example.test/a', new Date(30 * 60 * 1000).toISOString())],
      clock,
    );

    await links.linkFor('m1');
    clock.at = 25 * 60 * 1000;
    await links.linkFor('m1');
    expect(resolve).toHaveBeenCalledTimes(2);
    await links.linkFor('m1', true);
    expect(resolve).toHaveBeenCalledTimes(3);
  });

  it('asks again when the media service found the link stopped working', async () => {
    const { links, resolve } = build([], { at: 0 }, true);

    await links.linkFor('m1');
    await links.linkFor('m1');
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('refuses what the source refuses, a film still being prepared, and one with no source', async () => {
    const refused = build([{ kind: 'refused', reason: 'limitReached', message: null }]);
    const preparing = build([{ kind: 'preparing', progress: 0.5 }]);

    await expect(refused.links.linkFor('m1')).rejects.toMatchObject({ problem: 'sourceLimit' });
    await expect(preparing.links.linkFor('m1')).rejects.toMatchObject({
      problem: 'sourceNotReady',
    });
    await expect(build([]).links.linkFor('gone')).rejects.toBeInstanceOf(StreamRefusal);
  });

  it('keeps a link it is handed, and forgets one it is told to', async () => {
    const { links, resolve } = build([]);
    const link = {
      key: 'streamed-a',
      url: 'https://eu1.files.example.test/a',
      hosts: [],
      sizeBytes: 10,
      expiresAt: null,
    };

    links.remember('m1', link);
    expect(await links.linkFor('m1')).toBe(link);
    links.forget('m1');
    await links.linkFor('m1');
    expect(resolve).toHaveBeenCalledTimes(1);
  });
});
