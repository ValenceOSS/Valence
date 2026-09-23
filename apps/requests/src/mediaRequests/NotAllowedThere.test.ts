import { describe, expect, it } from 'vitest';
import { NotAllowedThere } from './NotAllowedThere';

describe('NotAllowedThere', () => {
  it('says who the service runs as, where it may not write, and what to set', () => {
    const error = new NotAllowedThere('/media/Films', 'user 1000 and group 1000');

    expect(error.name).toBe('NotAllowedThere');
    expect(error.message).toBe(
      'The requests service, running as user 1000 and group 1000, may not write to /media/Films. Set PUID and PGID on it to the owner of your media folders.',
    );
  });
});
