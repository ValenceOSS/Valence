import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LyricLines, standingOf } from './LyricLines';

const LYRICS = {
  isSynced: true,
  lines: [
    { atMs: 1000, text: 'First' },
    { atMs: 5000, text: 'Second' },
    { atMs: null, text: '' },
  ],
};

describe('LyricLines', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
      value: vi.fn(),
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollBy');
  });

  it('marks the line being sung', () => {
    render(<LyricLines lyrics={LYRICS} at={1} onSeek={vi.fn()} />);

    expect(screen.getByText('Second').closest('li')).toHaveAttribute('aria-current', 'true');
  });

  it('goes to a line when it is pressed', async () => {
    const onSeek = vi.fn();

    render(<LyricLines lyrics={LYRICS} at={0} onSeek={onSeek} />);

    await userEvent.click(screen.getByRole('button', { name: 'Second' }));

    expect(onSeek).toHaveBeenCalledWith(5);
  });

  it('draws a pause in the words as a note', () => {
    render(<LyricLines lyrics={LYRICS} at={0} onSeek={vi.fn()} />);

    expect(screen.getByText('♪')).toBeInTheDocument();
  });

  it('stops following the song once the reader scrolls, and offers Sync instead of pulling them back', () => {
    const { container } = render(
      <div style={{ overflowY: 'auto' }}>
        <LyricLines lyrics={LYRICS} at={0} onSeek={vi.fn()} />
      </div>,
    );

    expect(screen.queryByRole('button', { name: 'Sync' })).not.toBeInTheDocument();

    fireEvent.wheel(container.firstElementChild ?? container);

    expect(screen.getByRole('button', { name: 'Sync' })).toBeInTheDocument();
  });

  it('follows the song again once Sync is pressed', async () => {
    const { container } = render(
      <div style={{ overflowY: 'auto' }}>
        <LyricLines lyrics={LYRICS} at={0} onSeek={vi.fn()} />
      </div>,
    );

    fireEvent.wheel(container.firstElementChild ?? container);
    await userEvent.click(screen.getByRole('button', { name: 'Sync' }));

    expect(screen.queryByRole('button', { name: 'Sync' })).not.toBeInTheDocument();
  });

  it('offers no Sync for words that are not timed, since there is nothing to follow', () => {
    const { container } = render(
      <div style={{ overflowY: 'auto' }}>
        <LyricLines
          lyrics={{ isSynced: false, lines: [{ atMs: null, text: 'Words' }] }}
          at={-1}
          onSeek={vi.fn()}
        />
      </div>,
    );

    fireEvent.wheel(container.firstElementChild ?? container);

    expect(screen.queryByRole('button', { name: 'Sync' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LyricLines.displayName).toBe('LyricLines');
  });
});

describe('standingOf', () => {
  it('brings the line being sung up to full size and brightness', () => {
    expect(standingOf(3, 3, true, true)).toEqual({ opacity: 1, scale: 1, blur: 0 });
  });

  it('dims sung lines more than those to come', () => {
    expect(standingOf(1, 3, true, false).opacity).toBeLessThan(
      standingOf(5, 3, true, false).opacity,
    );
  });

  it('blurs lines further from the one sung only when immersive', () => {
    expect(standingOf(5, 3, true, false).blur).toBe(0);
    expect(standingOf(5, 3, true, true).blur).toBeGreaterThan(standingOf(4, 3, true, true).blur);
    expect(standingOf(30, 3, true, true).blur).toBe(6);
  });

  it('leaves untimed words evenly lit', () => {
    expect(standingOf(1, -1, false, true)).toEqual({ opacity: 0.9, scale: 1, blur: 0 });
  });
});
