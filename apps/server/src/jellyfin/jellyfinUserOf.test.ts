import { describe, expect, it } from 'vitest';
import { jellyfinUserOf } from './jellyfinUserOf';
import { aJellyfinCaller } from './testing/aJellyfinCaller';

describe('jellyfinUserOf', () => {
  it('describes the profile signed in as a user that plays and never administers', () => {
    expect(jellyfinUserOf(aJellyfinCaller(), 'server')).toMatchObject({
      Name: 'Marnie',
      Id: '02791fd985474c78898b00fe47b60627',
      ServerId: 'server',
      Policy: { IsAdministrator: false, EnableMediaPlayback: true },
    });
  });
});
