import { describe, expect, it } from 'vitest';
import { streamsOf } from './streamsOf';

describe('streamsOf', () => {
  const SESSIONS = [
    { clientId: 'tv', accountId: 'ada', playback: {} },
    { clientId: 'phone', accountId: 'ada', playback: {} },
    { clientId: 'laptop', accountId: 'ada', playback: null },
    { clientId: 'other', accountId: 'bo', playback: {} },
  ];

  it('counts what an account is playing on every device', () => {
    expect(streamsOf(SESSIONS, 'ada')).toBe(2);
  });

  it('leaves out the device asking, whose stream is being replaced', () => {
    expect(streamsOf(SESSIONS, 'ada', 'tv')).toBe(1);
  });
});
