import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStayWithTheParty } from '@ValenceClient/party/useStayWithTheParty';
import type { StayWithTheParty } from '@ValenceClient/party/useStayWithTheParty';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';

/**
 * Keeps a player with a party, for as long as the test changes either.
 *
 * @param first - What it starts watching, and the party then.
 * @returns How to change them, and what it was told to do.
 */
const stay = (first: { mediaId: string; partyMediaId: string | null; invitedTo?: string }) => {
  const leave = vi.fn();
  const onMovedTo = vi.fn();
  const propsOf = (now: typeof first): StayWithTheParty => ({
    watchParty: {
      party: now.partyMediaId === null ? null : aWatchParty({ mediaId: now.partyMediaId }),
      leave,
    },
    invitedTo: now.invitedTo ?? null,
    mediaId: now.mediaId,
    onMovedTo,
  });
  const drawn = renderHook(
    (props: StayWithTheParty) => {
      useStayWithTheParty(props);
    },
    { initialProps: propsOf(first) },
  );

  return {
    leave,
    onMovedTo,
    change: (now: typeof first) => {
      drawn.rerender(propsOf(now));
    },
  };
};

describe('useStayWithTheParty', () => {
  it('takes this viewer on to the title the party has moved to', () => {
    const { leave, onMovedTo, change } = stay({ mediaId: 'episode-1', partyMediaId: 'episode-1' });

    change({ mediaId: 'episode-1', partyMediaId: 'episode-2' });

    expect(onMovedTo).toHaveBeenCalledWith('episode-2');

    change({ mediaId: 'episode-2', partyMediaId: 'episode-2' });

    expect(leave).not.toHaveBeenCalled();
  });

  it('leaves the party when this viewer moves on to something it is not watching', () => {
    const { leave, onMovedTo, change } = stay({ mediaId: 'episode-1', partyMediaId: 'episode-1' });

    change({ mediaId: 'film-9', partyMediaId: 'episode-1' });

    expect(leave).toHaveBeenCalledTimes(1);
    expect(onMovedTo).not.toHaveBeenCalled();
  });

  it('leaves the party when opened on a title the party is not watching', () => {
    const { leave } = stay({ mediaId: 'film-9', partyMediaId: 'episode-1' });

    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('follows a party joined by invitation when it moves on afterwards', () => {
    const { leave, onMovedTo, change } = stay({
      mediaId: 'episode-1',
      partyMediaId: 'episode-1',
      invitedTo: 'p-1',
    });

    change({ mediaId: 'episode-1', partyMediaId: 'episode-2', invitedTo: 'p-1' });

    expect(onMovedTo).toHaveBeenCalledWith('episode-2');
    expect(leave).not.toHaveBeenCalled();
  });

  it('takes somebody invited to where the party has got to once they are in it', () => {
    const { leave, onMovedTo, change } = stay({
      mediaId: 'episode-1',
      partyMediaId: null,
      invitedTo: 'p-1',
    });

    change({ mediaId: 'episode-1', partyMediaId: 'episode-3', invitedTo: 'p-1' });

    expect(onMovedTo).toHaveBeenCalledWith('episode-3');
    expect(leave).not.toHaveBeenCalled();
  });

  it('leaves a party still being joined alone', () => {
    const { leave, onMovedTo, change } = stay({
      mediaId: 'episode-1',
      partyMediaId: 'film-1',
      invitedTo: 'p-2',
    });

    change({ mediaId: 'episode-1', partyMediaId: 'film-2', invitedTo: 'p-2' });

    expect(leave).not.toHaveBeenCalled();
    expect(onMovedTo).not.toHaveBeenCalled();
  });

  it('does nothing outside a party', () => {
    const { leave, onMovedTo, change } = stay({ mediaId: 'episode-1', partyMediaId: null });

    change({ mediaId: 'episode-2', partyMediaId: null });

    expect(leave).not.toHaveBeenCalled();
    expect(onMovedTo).not.toHaveBeenCalled();
  });
});
