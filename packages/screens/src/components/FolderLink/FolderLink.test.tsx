import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FolderLink } from './FolderLink';

describe('FolderLink', () => {
  it('writes the path and opens its folder when pressed', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(
      <FolderLink
        shown="Arrival (2016)/Arrival.mkv"
        folder="/media/films/Arrival (2016)"
        onOpen={onOpen}
      />,
    );

    expect(screen.getByText('Arrival (2016)/Arrival.mkv')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Open /media/films/Arrival (2016) in Files' }),
    );

    expect(onOpen).toHaveBeenCalledWith('/media/films/Arrival (2016)');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FolderLink.displayName).toBe('FolderLink');
  });
});
