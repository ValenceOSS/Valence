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
    expect(read({ ...FORM, name: ' ' }, false).problem).toBe('Enter a name for the app.');
    expect(read({ ...FORM, url: 'radarr' }, false).problem).not.toBeNull();
    expect(read({ ...FORM, url: 'ftp://radarr' }, false).problem).not.toBeNull();
    expect(read({ ...FORM, apiKey: '' }, false).problem).toBe(
      'Enter the app’s API key, found under Settings → General in the app.',
    );
    expect(read({ ...FORM, remotePath: '/movies' }, false).problem).toBe(
      'Enter both the app’s path and Valence’s path, or leave both empty.',
    );
  });
});
