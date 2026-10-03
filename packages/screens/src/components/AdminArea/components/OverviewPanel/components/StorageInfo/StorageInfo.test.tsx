import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StorageInfo } from './StorageInfo';

const CACHE = {
  previews: { count: 1, bytes: 5 * 1024 ** 2 },
  trickplay: { count: 1, bytes: 0 },
  sessions: { count: 0, bytes: 0 },
  atMs: Date.now(),
};

const open = async (libraryBytes: number | null) => {
  const user = userEvent.setup();

  render(<StorageInfo cache={CACHE} artwork={null} bookPages={null} libraryBytes={libraryBytes} />);

  await user.hover(screen.getByRole('button', { name: 'About the storage Valence is using' }));
};

describe('StorageInfo', () => {
  it('says what Valence keeps of its own, and how much it adds to the library', async () => {
    await open(5 * 1024 ** 3);

    expect(await screen.findByText('5.0 MB')).toBeInTheDocument();
    expect(screen.getByText('5.0 GB')).toBeInTheDocument();
    expect(screen.getByText(/0\.1%/)).toBeInTheDocument();
  });

  it('leaves out the library and the share where the library has not been sized', async () => {
    await open(null);

    expect(await screen.findByText('5.0 MB')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('says when it counted, so a stale figure does not read as a live one', async () => {
    await open(null);

    expect(await screen.findByText(/just now/)).toBeInTheDocument();
  });

  it('says it is counting rather than showing an empty cache', async () => {
    const user = userEvent.setup();

    render(<StorageInfo cache={null} artwork={null} bookPages={null} libraryBytes={null} />);

    await user.hover(screen.getByRole('button', { name: 'About the storage Valence is using' }));

    expect(await screen.findByText('Counting what is on the disk.')).toBeInTheDocument();
  });

  it('counts the pages of books into what Valence is keeping', async () => {
    const user = userEvent.setup();

    render(
      <StorageInfo
        cache={CACHE}
        artwork={{ count: 1, bytes: 1024 ** 2, atMs: Date.now() }}
        bookPages={{ count: 3, bytes: 2 * 1024 ** 2, atMs: Date.now() }}
        libraryBytes={null}
      />,
    );

    await user.hover(screen.getByRole('button', { name: 'About the storage Valence is using' }));

    expect(await screen.findByText('8.0 MB')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StorageInfo.displayName).toBe('StorageInfo');
  });
});
