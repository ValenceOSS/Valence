import { afterEach, describe, expect, it, vi } from 'vitest';
import { languageName } from './languageName';

describe('languageName', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names a language by its two- or three-letter code', () => {
    expect(languageName('fr')).toBe(
      new Intl.DisplayNames(undefined, { type: 'language' }).of('fr'),
    );
    expect(languageName('eng')).toBe(languageName('en'));
  });

  it('gives the code back in capitals where it names no language', () => {
    expect(languageName('not a code')).toBe('NOT A CODE');
  });

  it('gives the code back in capitals on an engine that cannot name languages', () => {
    vi.stubGlobal('Intl', { ...Intl, DisplayNames: undefined });

    expect(languageName('fr')).toBe('FR');
  });
});
