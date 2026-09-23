import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { tracksOf } from '@ValenceScreens/listening/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceScreens/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceScreens/testing/anAudiobook';
import { AudiobookPanel } from './AudiobookPanel';

/**
 * Draws the panel over a player that has the book open, drawing again as the player changes.
 *
 * @returns The player.
 */
const opened = () => {
  const fake = aFakeAudiobookPlayer();
  const { book, chapters } = anAudiobook();

  fake.player.open(book, tracksOf(chapters), null);
  fake.audio.fire('loadedmetadata');

  const { rerender } = render(<AudiobookPanel state={fake.player.read()} player={fake.player} />);

  fake.player.subscribe(() => {
    rerender(<AudiobookPanel state={fake.player.read()} player={fake.player} />);
  });

  return fake;
};

describe('AudiobookPanel', () => {
  it('lists every chapter with how long it lasts, the one playing marked', () => {
    opened();

    const chapters = screen.getByRole('list', { name: 'Chapters' });

    expect(chapters.querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Part 1/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /The Institute/ })).toHaveTextContent('5:00');
  });

  it('goes to the chapter after, and back', async () => {
    const { player } = opened();

    await userEvent.click(screen.getByRole('button', { name: 'Next chapter' }));

    expect(player.read().bookPositionSeconds).toBe(600);

    await userEvent.click(screen.getByRole('button', { name: 'Previous chapter' }));

    expect(player.read().bookPositionSeconds).toBe(0);
  });

  it('plays faster from the speed menu', async () => {
    const { player } = opened();

    await userEvent.click(screen.getByRole('button', { name: 'Speed' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /1\.5×/ }));

    expect(player.read().speed).toBe(1.5);
  });

  it('falls asleep at the end of the chapter from the sleep menu, saying so', async () => {
    const { player } = opened();

    await userEvent.click(screen.getByRole('button', { name: 'Sleep timer' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: /At the end of this chapter/ }),
    );

    expect(player.read().sleep).toEqual({ kind: 'endOfChapter', atBookSeconds: 600 });
    expect(screen.getByText('End of chapter')).toBeInTheDocument();
  });

  it('says a track would not play', () => {
    const { audio } = opened();

    act(() => {
      audio.fire('error');
    });

    expect(screen.getByRole('alert')).toHaveTextContent('That track would not play.');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AudiobookPanel.displayName).toBe('AudiobookPanel');
  });
});
