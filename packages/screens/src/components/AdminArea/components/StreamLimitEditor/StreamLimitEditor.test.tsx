import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import { StreamLimitEditor } from './StreamLimitEditor';

const FREE: StreamLimit = {
  maxBitrateKbps: null,
  maxStreams: null,
  maxQuality: null,
  limitsDownloads: false,
};

describe('StreamLimitEditor', () => {
  it('shows the limit as it is saved, with what the caller has to say above it', () => {
    render(
      <StreamLimitEditor
        own={{ maxBitrateKbps: 4000, maxStreams: 3, maxQuality: '1080p', limitsDownloads: true }}
        onSave={vi.fn()}
      >
        <p>Streaming now: 1</p>
      </StreamLimitEditor>,
    );

    expect(screen.getByText('Streaming now: 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Highest quality' })).toHaveTextContent('1080p');
    expect(screen.getByRole('button', { name: 'Highest bitrate' })).toHaveTextContent('4 Mbps');
    expect(screen.getByRole('button', { name: 'Streams at once' })).toHaveTextContent('3');
    expect(screen.getByRole('switch', { name: 'Limit downloads too' })).toBeChecked();
  });

  it('shows no limit before the limit has been read', () => {
    render(<StreamLimitEditor own={undefined} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Highest bitrate' })).toHaveTextContent('No limit');
  });

  it('will not save until something has changed', () => {
    render(<StreamLimitEditor own={FREE} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves every side of the limit together, and says so', async () => {
    const onSave = vi.fn<(limit: StreamLimit) => Promise<boolean>>().mockResolvedValue(true);
    const user = userEvent.setup();

    render(<StreamLimitEditor own={FREE} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Highest quality' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '720p' }));
    await user.click(screen.getByRole('switch', { name: 'Limit downloads too' }));
    await user.click(screen.getByRole('button', { name: 'Highest bitrate' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '10 Mbps' }));
    await user.click(screen.getByRole('button', { name: 'Streams at once' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '2' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith({
      maxBitrateKbps: 10_000,
      maxStreams: 2,
      maxQuality: '720p',
      limitsDownloads: true,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Streaming limits saved.');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('says when the limit could not be saved, and keeps what was chosen', async () => {
    const onSave = vi.fn<(limit: StreamLimit) => Promise<boolean>>().mockResolvedValue(false);
    const user = userEvent.setup();

    render(<StreamLimitEditor own={FREE} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Streams at once' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Streaming limits couldn’t be saved.',
    );
    expect(screen.getByRole('button', { name: 'Streams at once' })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StreamLimitEditor.displayName).toBe('StreamLimitEditor');
  });
});
