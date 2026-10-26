import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { DownloadOptions } from './DownloadOptions';

const OPTIONS: DownloadOffer['options'] = [
  {
    quality: 'original',
    label: 'Original',
    meaning: 'Exactly what is on the server.',
    bytes: 60_000_000_000,
    comparison: null,
    wouldTranscode: false,
    savesSpace: true,
  },
  {
    quality: '1080p',
    label: '1080p',
    meaning: 'Looks great on a TV.',
    bytes: 4_000_000_000,
    comparison: 'about a 15th of the original',
    wouldTranscode: true,
    savesSpace: true,
  },
  {
    quality: '720p',
    label: '720p',
    meaning: 'Fine on a phone.',
    bytes: null,
    comparison: null,
    wouldTranscode: true,
    savesSpace: false,
  },
];

describe('DownloadOptions', () => {
  it('offers each size with what it costs', () => {
    render(
      <DownloadOptions
        options={OPTIONS}
        chosen={null}
        onChoose={vi.fn()}
        isOfASeries={false}
        freeBytes={null}
      />,
    );

    expect(screen.getByText('about a 15th of the original')).toBeInTheDocument();
    expect(screen.getByText('Size unknown')).toBeInTheDocument();
    expect(screen.getAllByText('Converted')).toHaveLength(2);
  });

  it('tells which size was chosen', async () => {
    const onChoose = vi.fn();

    render(
      <DownloadOptions
        options={OPTIONS}
        chosen="original"
        onChoose={onChoose}
        isOfASeries={false}
        freeBytes={null}
      />,
    );
    await userEvent.click(screen.getByText('1080p'));

    expect(onChoose).toHaveBeenCalledWith('1080p');
  });

  it('says the chosen size fits in the room this device has', () => {
    render(
      <DownloadOptions
        options={OPTIONS}
        chosen="1080p"
        onChoose={vi.fn()}
        isOfASeries={false}
        freeBytes={500_000_000_000}
      />,
    );

    expect(screen.getByText(/and this device has/u)).toBeInTheDocument();
  });

  it('warns when the chosen size will not fit', () => {
    render(
      <DownloadOptions
        options={OPTIONS}
        chosen="original"
        onChoose={vi.fn()}
        isOfASeries={false}
        freeBytes={10_000_000_000}
      />,
    );

    expect(screen.getByText('Not enough space')).toBeInTheDocument();
  });

  it('gives a whole programme its sizes as rough ones', () => {
    render(
      <DownloadOptions
        options={OPTIONS}
        chosen={null}
        onChoose={vi.fn()}
        isOfASeries
        freeBytes={null}
      />,
    );

    expect(screen.getAllByText(/^about /u).length).toBeGreaterThan(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadOptions.displayName).toBe('DownloadOptions');
  });
});
