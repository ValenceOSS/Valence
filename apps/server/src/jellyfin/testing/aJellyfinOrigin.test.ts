import { describe, expect, it } from 'vitest';
import { aJellyfinOrigin } from './aJellyfinOrigin';

describe('aJellyfinOrigin', () => {
  it('is Findroid on a phone, signed in, unless told otherwise', async () => {
    expect(aJellyfinOrigin().client).toMatchObject({ client: 'Findroid', token: 's.a-session' });
    expect((await aJellyfinOrigin().send(new Request('http://x.test'))).status).toBe(404);
  });
});
