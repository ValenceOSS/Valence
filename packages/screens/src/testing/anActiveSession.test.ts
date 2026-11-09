import { describe, expect, it } from 'vitest';
import { anActiveSession } from './anActiveSession';

describe('anActiveSession', () => {
  it('is a tab with nothing playing, changed only where asked', () => {
    const session = anActiveSession({ profileName: 'Katie' });

    expect(session.playback).toBeNull();
    expect(session.profileName).toBe('Katie');
    expect(session.clientId).toBe('tab-1');
  });
});
