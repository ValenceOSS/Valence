import { describe, expect, it } from 'vitest';
import { whyRequestsCannotBeMadeNow } from './whyRequestsCannotBeMadeNow';
import { refuse } from '@ValenceI18n/refuse';

describe('whyRequestsCannotBeMadeNow', () => {
  it('says why where the requests service was not heard, never where it is', () => {
    expect(
      whyRequestsCannotBeMadeNow({
        status: 502,
        error: 'http://localhost:8421 didn’t respond',
        code: null,
        values: {},
      }),
    ).toEqual(
      new Error('The requests service couldn’t take the request just now. Ask again later.'),
    );
  });

  it('says nothing where requesting is off or this request was turned down', () => {
    expect(
      whyRequestsCannotBeMadeNow({ status: 404, ...refuse('error.common.requestingIsOff') }),
    ).toBeNull();
    expect(
      whyRequestsCannotBeMadeNow({ status: 403, ...refuse('error.music.noSuchPlaylist') }),
    ).toBeNull();
  });
});
