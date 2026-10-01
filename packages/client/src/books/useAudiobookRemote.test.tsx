import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emitPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { aFakeAudiobookPlayerWith } from '@ValenceClient/testing/aFakeAudiobookPlayerWith';
import { useAudiobookRemote } from './useAudiobookRemote';

describe('useAudiobookRemote', () => {
  it('pauses, resumes and stops the audiobook as an administrator says', () => {
    const { player } = aFakeAudiobookPlayerWith(vi.fn);
    const pausing = vi.spyOn(player, 'pause');
    const playing = vi.spyOn(player, 'play');
    const closing = vi.spyOn(player, 'close');

    renderHook(() => {
      useAudiobookRemote(player);
    });

    emitPresenceEvent({ kind: 'book', command: 'pause' });
    emitPresenceEvent({ kind: 'book', command: 'resume' });
    emitPresenceEvent({ kind: 'book', command: 'stop' });

    expect(pausing).toHaveBeenCalledTimes(1);
    expect(playing).toHaveBeenCalledTimes(1);
    expect(closing).toHaveBeenCalledTimes(1);
  });

  it('ignores presence news that is not about a book', () => {
    const { player } = aFakeAudiobookPlayerWith(vi.fn);
    const pausing = vi.spyOn(player, 'pause');

    renderHook(() => {
      useAudiobookRemote(player);
    });

    emitPresenceEvent({ kind: 'paused', reason: 'An administrator paused this' });

    expect(pausing).not.toHaveBeenCalled();
  });
});
