import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it } from 'vitest';
import { ArrAppFailure } from './ArrAppFailure';

describe('ArrAppFailure', () => {
  it('carries the reason as its message, and the kind of problem where there is one', () => {
    const failure = new ArrAppFailure(sayVerbatim('Radarr refused the key'), 'ArrAppKeyRefused');

    expect(failure.message).toBe('Radarr refused the key');
    expect(failure.name).toBe('ArrAppFailure');
    expect(failure.problemCode).toBe('ArrAppKeyRefused');
    expect(new ArrAppFailure(sayVerbatim('Something else')).problemCode).toBeNull();
    expect(new ArrAppFailure(sayVerbatim('Something else')).status).toBeNull();
    expect(new ArrAppFailure(sayVerbatim('Gone'), null, 404).status).toBe(404);
  });
});
