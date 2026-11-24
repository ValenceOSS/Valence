import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StreamLimitCard } from './StreamLimitCard';
import type { TypedStreamLimit } from './StreamLimitCard.types';

const FREE: TypedStreamLimit = { bitrate: '', streams: '', quality: null, limitsDownloads: false };

describe('StreamLimitCard', () => {
  it('shows no limit on every menu where nothing is set, and no downloads switch', () => {
    render(<StreamLimitCard typed={FREE} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Highest quality' })).toHaveTextContent('No limit');
    expect(screen.getByRole('button', { name: 'Highest bitrate' })).toHaveTextContent('No limit');
    expect(screen.getByRole('button', { name: 'Streams at once' })).toHaveTextContent('No limit');
    expect(screen.queryByRole('switch', { name: 'Limit downloads too' })).not.toBeInTheDocument();
  });

  it('says what each limit does, what limits cost, and what the caller has to say', () => {
    render(
      <StreamLimitCard typed={FREE} onChange={vi.fn()}>
        <p>Whose limits these are.</p>
      </StreamLimitCard>,
    );

    expect(screen.getByText('Whose limits these are.')).toBeInTheDocument();
    expect(
      screen.getByText('Anything above this is sent at this quality instead.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/more of what’s played has to be transcoded/)).toBeInTheDocument();
  });

  it('offers the qualities down to 360p, leaving out the smallest', async () => {
    const user = userEvent.setup();

    render(<StreamLimitCard typed={FREE} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Highest quality' }));

    expect(await screen.findByRole('menuitemradio', { name: '4K' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: '360p' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: '240p' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: '144p' })).not.toBeInTheDocument();
  });

  it('is told the quality chosen, and no limit for No limit', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<StreamLimitCard typed={{ ...FREE, quality: '1080p' }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Highest quality' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '720p' }));

    expect(onChange).toHaveBeenLastCalledWith({ ...FREE, quality: '720p' });

    await user.click(screen.getByRole('button', { name: 'Highest quality' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'No limit' }));

    expect(onChange).toHaveBeenLastCalledWith({ ...FREE, quality: null });
  });

  it('offers to hold downloads to the quality once there is one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const typed: TypedStreamLimit = { ...FREE, quality: '720p' };

    render(<StreamLimitCard typed={typed} onChange={onChange} />);

    const downloads = screen.getByRole('switch', { name: 'Limit downloads too' });

    expect(downloads).not.toBeChecked();

    await user.click(downloads);

    expect(onChange).toHaveBeenCalledWith({ ...typed, limitsDownloads: true });
  });

  it('offers the usual bitrates in megabits, highest first, and is told the one chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<StreamLimitCard typed={FREE} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Highest bitrate' }));

    const offered = (await screen.findAllByRole('menuitemradio')).map(
      (option) => option.textContent,
    );

    expect(offered).toEqual([
      'No limit',
      '40 Mbps',
      '20 Mbps',
      '10 Mbps',
      '8 Mbps',
      '4 Mbps',
      '2 Mbps',
    ]);

    await user.click(screen.getByRole('menuitemradio', { name: '8 Mbps' }));

    expect(onChange).toHaveBeenCalledWith({ ...FREE, bitrate: '8' });
  });

  it('offers the usual stream counts, lowest first, and empties the field for No limit', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<StreamLimitCard typed={{ ...FREE, streams: '2' }} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Streams at once' })).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: 'Streams at once' }));

    const offered = (await screen.findAllByRole('menuitemradio')).map(
      (option) => option.textContent,
    );

    expect(offered).toEqual(['No limit', '1', '2', '3', '4', '5', '10']);

    await user.click(screen.getByRole('menuitemradio', { name: 'No limit' }));

    expect(onChange).toHaveBeenCalledWith({ ...FREE, streams: '' });
  });

  it('keeps a saved bitrate that is not one of the usual in its place, and chosen', async () => {
    const user = userEvent.setup();

    render(<StreamLimitCard typed={{ ...FREE, bitrate: '15' }} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Highest bitrate' })).toHaveTextContent('15 Mbps');

    await user.click(screen.getByRole('button', { name: 'Highest bitrate' }));

    const offered = (await screen.findAllByRole('menuitemradio')).map(
      (option) => option.textContent,
    );

    expect(offered.indexOf('15 Mbps')).toBe(offered.indexOf('20 Mbps') + 1);
    expect(screen.getByRole('menuitemradio', { name: '15 Mbps' })).toBeChecked();
  });

  it('keeps a saved stream count that is not one of the usual in its place', async () => {
    const user = userEvent.setup();

    render(<StreamLimitCard typed={{ ...FREE, streams: '7' }} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Streams at once' }));

    const offered = (await screen.findAllByRole('menuitemradio')).map(
      (option) => option.textContent,
    );

    expect(offered).toEqual(['No limit', '1', '2', '3', '4', '5', '7', '10']);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StreamLimitCard.displayName).toBe('StreamLimitCard');
  });
});
