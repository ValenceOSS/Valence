import { describe, expect, it } from 'vitest';
import { aKeptSession } from './aKeptSession';

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

describe('aKeptSession', () => {
  it('plays the file on this device directly, as it stands', () => {
    const session = aKeptSession(MEDIA_ID, 'valence-kept://one');

    expect(session.delivery).toEqual({ kind: 'direct', url: 'valence-kept://one' });
    expect(session.plan.video.kind).toBe('passthrough');
  });
});
