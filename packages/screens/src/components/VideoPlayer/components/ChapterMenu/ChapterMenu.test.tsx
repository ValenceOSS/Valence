import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChapterMenu } from './ChapterMenu';

const CHAPTERS = [
  { title: 'Opening', startSeconds: 0, endSeconds: 300 },
  { title: null, startSeconds: 300, endSeconds: 900 },
  { title: 'The heist', startSeconds: 900, endSeconds: 1500 },
];

describe('ChapterMenu', () => {
  it('lists every chapter by name, numbering those the file left unnamed', async () => {
    const user = userEvent.setup();

    render(<ChapterMenu chapters={CHAPTERS} position={0} onSeek={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Chapters' }));

    expect(screen.getByRole('button', { name: /Opening/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chapter 2/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /The heist/ })).toBeInTheDocument();
  });

  it('picks out the chapter playing now', async () => {
    const user = userEvent.setup();

    render(<ChapterMenu chapters={CHAPTERS} position={1000} onSeek={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Chapters' }));

    expect(screen.getByRole('button', { name: /The heist/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('moves to where a chosen chapter starts', async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();

    render(<ChapterMenu chapters={CHAPTERS} position={0} onSeek={onSeek} />);

    await user.click(screen.getByRole('button', { name: 'Chapters' }));
    await user.click(screen.getByRole('button', { name: /The heist/ }));

    expect(onSeek).toHaveBeenCalledWith(900);
  });

  it('is not drawn for a file of a single chapter', () => {
    render(<ChapterMenu chapters={CHAPTERS.slice(0, 1)} position={0} onSeek={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Chapters' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChapterMenu.displayName).toBe('ChapterMenu');
  });
});
