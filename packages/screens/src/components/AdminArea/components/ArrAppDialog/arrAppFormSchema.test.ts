import { describe, expect, it } from 'vitest';
import { ARR_APP_NAMES } from '@ValenceScreens/components/AdminArea/ARR_APP_NAMES';
import { arrAppFormFor } from './readArrAppForm';
import type { ArrAppForm } from './readArrAppForm';
import { arrAppFormSchema } from './arrAppFormSchema';

const read = (form: ArrAppForm, hasKey: boolean) => {
  const parsed = arrAppFormSchema(hasKey).safeParse(form);

  return parsed.success
    ? { draft: parsed.data, problem: null }
    : { draft: null, problem: parsed.error.issues[0]?.message ?? null };
};

describe('arrAppFormSchema', () => {
  const FORM = { ...arrAppFormFor(null, ARR_APP_NAMES), apiKey: ' key ' };

  it('reads an app to connect', () => {
    expect(read(FORM, false)).toEqual({
      draft: {
        kind: 'radarr',
        name: 'Radarr',
        url: 'http://radarr:7878',
        apiKey: 'key',
        remotePath: '',
        localPath: '',
        isEnabled: true,
      },
      problem: null,
    });
    expect(read({ ...FORM, apiKey: '' }, true).draft).not.toBeNull();
  });

  it('says the first thing wrong', () => {
    expect(read({ ...FORM, name: ' ' }, false).problem).toBe('Give the app a name.');
    expect(read({ ...FORM, url: 'radarr' }, false).problem).not.toBeNull();
    expect(read({ ...FORM, url: 'ftp://radarr' }, false).problem).not.toBeNull();
    expect(read({ ...FORM, apiKey: '' }, false).problem).toBe(
      'It needs its API key, from Settings → General in the app.',
    );
    expect(read({ ...FORM, remotePath: '/movies' }, false).problem).toBe(
      'Say where its library is both as the app sees it and as Valence does, or neither.',
    );
  });
});
