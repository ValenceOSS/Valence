import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AudiobookBar } from './AudiobookBar';

beforeEach(() => {
  installATestClient();
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('{}', { status: 404 }))),
  );
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

/**
 * Draws the bar over a player that has the book open and playing.
 *
 * @returns The player and its audio.
 */
const listening = () => {
  const fake = aFakeAudiobookPlayer();
  const { book, chapters } = anAudiobook();

  renderInAnAddress(<AudiobookBar player={fake.player} />);

  act(() => {
    fake.player.open(book, tracksOf(chapters), null);
    fake.audio.fire('loadedmetadata');
    fake.audio.fire('playing');
  });

  return fake;
};

describe('AudiobookBar', () => {
  it('draws nothing while there is no book to hear', () => {
    renderInAnAddress(<AudiobookBar player={aFakeAudiobookPlayer().player} />);

    expect(screen.queryByRole('region', { name: 'Listening to' })).not.toBeInTheDocument();
  });

  it('says what is playing, and the chapter it is on', () => {
    listening();

    expect(screen.getByRole('region', { name: 'Listening to' })).toBeInTheDocument();
    expect(screen.getByText('Red Rising')).toBeInTheDocument();
    expect(screen.getByText('Part 1')).toBeInTheDocument();
  });

  it('pauses, and skips back fifteen seconds and on thirty', async () => {
    const { player, audio } = listening();

    await userEvent.click(screen.getByRole('button', { name: 'On 30 seconds' }));

    expect(player.read().bookPositionSeconds).toBe(30);

    await userEvent.click(screen.getByRole('button', { name: 'Back 15 seconds' }));

    expect(player.read().bookPositionSeconds).toBe(15);

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(audio.pause).toHaveBeenCalled();
  });

  it('opens every chapter to go straight to, and the speed', async () => {
    const { player } = listening();

    await userEvent.click(screen.getByRole('button', { name: 'Open the player' }));
    await userEvent.click(await screen.findByRole('button', { name: /The Passage/ }));

    expect(player.read().bookPositionSeconds).toBe(900);
    expect(screen.getByRole('button', { name: /The Passage/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('keeps where somebody was as they stop listening, and goes', async () => {
    const { save } = listening();

    await userEvent.click(screen.getByRole('button', { name: 'Stop listening' }));

    expect(save).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Listening to' })).not.toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AudiobookBar.displayName).toBe('AudiobookBar');
  });
});
