import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { setMusicVisualiser } from '@ValenceScreens/music/musicVisualiser';
import { VISUALISERS } from '@ValenceScreens/music/visualisers/VISUALISERS';
import { MusicVisualiser } from './MusicVisualiser';
import type * as MotionReact from 'motion/react';

const motion = vi.hoisted(() => ({ isReduced: false }));

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof MotionReact>('motion/react');

  return { ...actual, useReducedMotionConfig: () => motion.isReduced };
});

const first = VISUALISERS[0]?.name ?? '';

const second = VISUALISERS[1]?.name ?? '';

const last = VISUALISERS[VISUALISERS.length - 1]?.name ?? '';

const playing = () => aFakeMusicPlayer({ current: aTrack(1), isPlaying: true });

const open = () => {
  act(() => {
    setMusicVisualiser(true);
  });
};

beforeEach(() => {
  motion.isReduced = false;
});

afterEach(() => {
  setMusicVisualiser(false);
  window.localStorage.clear();
  vi.useRealTimers();
});

describe('MusicVisualiser', () => {
  it('draws nothing until it is opened', () => {
    renderInAnAddress(<MusicVisualiser player={playing().player} />);

    expect(screen.queryByRole('region', { name: /visualiser/ })).not.toBeInTheDocument();
  });

  it('fills the screen with the first visualiser, its picture hidden from assistive technology', async () => {
    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    const view = await screen.findByRole('region', { name: `${first}, visualiser` });

    expect(view.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
  });

  it('steps to the next visualiser and the one before, round the ends of the list', async () => {
    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Next visualiser' }));

    expect(
      await screen.findByRole('region', { name: `${second}, visualiser` }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Previous visualiser' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous visualiser' }));

    expect(await screen.findByRole('region', { name: `${last}, visualiser` })).toBeInTheDocument();
  });

  it('changes visualiser with the arrow keys, and comes back to the one last chosen', async () => {
    const { unmount } = renderInAnAddress(<MusicVisualiser player={playing().player} />);

    open();
    await screen.findByRole('region', { name: `${first}, visualiser` });
    await userEvent.keyboard('{ArrowRight}');

    expect(
      await screen.findByRole('region', { name: `${second}, visualiser` }),
    ).toBeInTheDocument();

    unmount();
    setMusicVisualiser(false);
    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    expect(
      await screen.findByRole('region', { name: `${second}, visualiser` }),
    ).toBeInTheDocument();
  });

  it('goes away with the close button and with Escape', async () => {
    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Close visualiser' }));

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /visualiser/ })).not.toBeInTheDocument();
    });

    open();
    await screen.findByRole('region', { name: `${first}, visualiser` });
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /visualiser/ })).not.toBeInTheDocument();
    });
  });

  it('keeps Escape to itself, so it leaves the visualiser without leaving anything beneath', async () => {
    const heard = vi.fn();

    window.addEventListener('keydown', heard);
    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    await screen.findByRole('region', { name: `${first}, visualiser` });
    await userEvent.keyboard('{Escape}');

    expect(heard).not.toHaveBeenCalled();
    window.removeEventListener('keydown', heard);
  });

  it('shows the controls on arrival, fades them once they are left alone, and brings them back with the pointer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    const view = await screen.findByRole('region', { name: `${first}, visualiser` });

    expect(screen.getByRole('button', { name: 'Close visualiser' })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Close visualiser' })).not.toBeInTheDocument();
    });
    expect(view).toHaveClass('cursor-none');

    fireEvent.pointerMove(view);

    expect(await screen.findByRole('button', { name: 'Close visualiser' })).toBeInTheDocument();
  });

  it('offers full screen only where the browser allows it', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });

    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    await screen.findByRole('button', { name: 'Close visualiser' });

    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();

    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
  });

  it('says so, rather than drawing silence, where the browser cannot listen to the song', async () => {
    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    expect(
      await screen.findByText(
        'This browser can’t listen to this song, so there is nothing to draw.',
      ),
    ).toBeInTheDocument();
  });

  it('is not shown to anybody who has asked for less movement', () => {
    motion.isReduced = true;

    renderInAnAddress(<MusicVisualiser player={playing().player} />);
    open();

    expect(screen.queryByRole('region', { name: /visualiser/ })).not.toBeInTheDocument();
  });

  it('closes itself when nothing is playing', async () => {
    const { player, set } = playing();

    renderInAnAddress(<MusicVisualiser player={player} />);
    open();
    await screen.findByRole('region', { name: `${first}, visualiser` });

    act(() => {
      set({ current: null });
    });

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /visualiser/ })).not.toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicVisualiser.displayName).toBe('MusicVisualiser');
  });
});
