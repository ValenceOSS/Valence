import { describe, expect, it } from 'vitest';
import { jellyfinSessionOf } from './jellyfinSessionOf';
import { aJellyfinCaller } from './testing/aJellyfinCaller';

describe('jellyfinSessionOf', () => {
  it('describes the app’s own session, the same for the same device and profile', () => {
    const session = jellyfinSessionOf(aJellyfinCaller(), 'server');

    expect(session).toMatchObject({
      UserId: '02791fd985474c78898b00fe47b60627',
      UserName: 'Marnie',
      Client: 'Findroid',
      DeviceName: 'Pixel 8',
      DeviceId: 'pixel8abcdef',
    });
    expect(jellyfinSessionOf(aJellyfinCaller(), 'server').Id).toBe(session.Id);
  });
});
