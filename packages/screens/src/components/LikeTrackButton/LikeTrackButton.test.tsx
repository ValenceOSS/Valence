import { describe, expect, it } from 'vitest';
import { LikeTrackButton } from './LikeTrackButton';

describe('LikeTrackButton', () => {
  it('sets a display name so devtools can identify it', () => {
    expect(LikeTrackButton.displayName).toBe('LikeTrackButton');
  });
});
