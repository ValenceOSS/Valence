import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { say } from '@ValenceI18n/say';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { fetchTheWords } from './fetchTheWords';
import { readKeptWords } from './readKeptWords';

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  speakLanguage('en');
  forgetPlatform();
  vi.unstubAllGlobals();
});

/**
 * A server answering every request for words with these.
 *
 * @param words - The words.
 * @returns The fetch it answers through.
 */
const aServerWith = (words: Record<string, string>) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(words), { status: 200 })));

describe('fetchTheWords', () => {
  it('fetches a language’s words, keeps them and speaks them', async () => {
    vi.stubGlobal('fetch', aServerWith({ 'common.cancel': 'Abbrechen' }));

    expect(await fetchTheWords('de', 1000)).toBe(true);
    expect(say('common.cancel')).toBe('Abbrechen');
    expect(readKeptWords()?.language).toBe('de');
  });

  it('asks again only once the kept words are a day old', async () => {
    const server = aServerWith({ 'common.cancel': 'Abbrechen' });

    vi.stubGlobal('fetch', server);
    await fetchTheWords('de', 1000);

    expect(await fetchTheWords('de', 1000 + DAY - 1)).toBe(false);
    expect(server).toHaveBeenCalledTimes(1);
    expect(await fetchTheWords('de', 1000 + DAY)).toBe(false);
    expect(server).toHaveBeenCalledTimes(2);
  });

  it('asks nothing for English, and leaves the app as it was where the server cannot answer', async () => {
    const server = vi.fn(() => Promise.reject(new Error('offline')));

    vi.stubGlobal('fetch', server);

    expect(await fetchTheWords('en')).toBe(false);
    expect(server).not.toHaveBeenCalled();
    expect(await fetchTheWords('de')).toBe(false);
    expect(say('common.cancel')).toBe('Cancel');
  });
});
