import { describe, expect, it } from 'vitest';
import { aJellyfinCaller } from './aJellyfinCaller';

describe('aJellyfinCaller', () => {
  it('is the owner profile of an account unless told otherwise', () => {
    expect(aJellyfinCaller().profile).toMatchObject({ name: 'Marnie', isOwner: true });
    expect(aJellyfinCaller({ token: 'k.x' }).token).toBe('k.x');
  });
});
