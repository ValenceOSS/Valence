import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { say } from '@ValenceI18n/say';
import { speakLanguage } from '@ValenceI18n/speakLanguage';
import { SPOKEN } from '@ValenceI18n/SPOKEN';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { catchUpOnLanguage } from './catchUpOnLanguage';

beforeEach(() => {
  installPlatform(aStillPlatform());
  vi.stubGlobal('navigator', { languages: ['en-GB'] });
});

afterEach(() => {
  speakLanguage('en');
  forgetPlatform();
  vi.unstubAllGlobals();
});

/**
 * A server whose administrator chose a language, and which has its words.
 *
 * @param server - The server's language.
 * @param words - Its words.
 * @returns The fetch it answers through.
 */
const aServer = (server: string | null, words: Record<string, string>) =>
  vi.fn((address: string) =>
    Promise.resolve(
      new Response(
        JSON.stringify(address.endsWith('/api/language') ? { server, profile: null } : words),
      ),
    ),
  );

describe('catchUpOnLanguage', () => {
  it('speaks the language the server chose, fetching its words', async () => {
    vi.stubGlobal('fetch', aServer('de', { 'common.cancel': 'Abbrechen' }));

    expect(await catchUpOnLanguage()).toBe('de');
    expect(say('common.cancel')).toBe('Abbrechen');
  });

  it('goes back to English where the server chose it', async () => {
    speakLanguage('de', { 'common.cancel': 'Abbrechen' });
    vi.stubGlobal('fetch', aServer('en', {}));

    expect(await catchUpOnLanguage()).toBe('en');
    expect(SPOKEN.language).toBe('en');
    expect(say('common.cancel')).toBe('Cancel');
  });
});
