import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { SeriesDialog } from './SeriesDialog';

const RED_RISING = {
  ...anAudiobook().book,
  id: 'red',
  series: { name: 'Red Rising', position: 1 },
};

const GOLDEN_SON = {
  ...RED_RISING,
  id: 'golden',
  title: 'Golden Son',
  series: { name: 'Red Rising', position: 2 },
};

describe('SeriesDialog', () => {
  it('names the series, how many books it holds and who wrote them', () => {
    renderInAnAddress(
      <SeriesDialog
        series={{ name: 'Red Rising', books: [RED_RISING, GOLDEN_SON] }}
        onClose={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('2 books · Pierce Brown');
    expect(screen.getByText('Book 2')).toBeInTheDocument();
  });

  it('opens the book chosen, and closes', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    renderInAnAddress(
      <SeriesDialog
        series={{ name: 'Red Rising', books: [RED_RISING, GOLDEN_SON] }}
        onClose={onClose}
        onOpen={onOpen}
      />,
    );

    await userEvent.click(screen.getByText('Golden Son'));

    expect(onOpen).toHaveBeenCalledWith(GOLDEN_SON);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('is closed while no series is open', () => {
    renderInAnAddress(<SeriesDialog series={null} onClose={vi.fn()} onOpen={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeriesDialog.displayName).toBe('SeriesDialog');
  });
});
