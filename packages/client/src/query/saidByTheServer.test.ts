import { describe, expect, it } from 'vitest';
import { RequestFailed } from './RequestFailed';
import { saidByTheServer } from './saidByTheServer';

describe('saidByTheServer', () => {
  it('reads what the server said when it refused', () => {
    expect(saidByTheServer(new RequestFailed('/api/x', 503, false, 'Couldn’t reach TMDB.'))).toBe(
      'Couldn’t reach TMDB.',
    );
  });

  it('says nothing where the server said nothing, or the read failed some other way', () => {
    expect(saidByTheServer(new RequestFailed('/api/x', 500))).toBeNull();
    expect(saidByTheServer(new Error('offline'))).toBeNull();
    expect(saidByTheServer(null)).toBeNull();
  });
});
