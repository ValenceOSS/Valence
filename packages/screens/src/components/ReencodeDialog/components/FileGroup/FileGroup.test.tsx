import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileGroup } from './FileGroup';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const GIGABYTE = 1024 ** 3;

const file = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'item-1',
  libraryId: 'library-1',
  title: 'Charm Offensive',
  year: 2025,
  durationSeconds: 3600,
  width: 3840,
  height: 1606,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'Pluribus',
  seasonNumber: 1,
  episodeNumber: 1,
  sizeBytes: 4 * GIGABYTE,
  ...overrides,
});

const programme = {
  key: 'Pluribus',
  title: 'Pluribus',
  items: [file(), file({ id: 'item-2', title: 'Grace', episodeNumber: 2, sizeBytes: 2 * GIGABYTE })],
  sizeBytes: 6 * GIGABYTE,
};

const alone = {
  key: 'item-9',
  title: 'Azkaban',
  items: [file({ id: 'item-9', title: 'Azkaban', seriesTitle: null, seasonNumber: null, episodeNumber: null })],
  sizeBytes: 4 * GIGABYTE,
};

const props = {
  chosen: new Set<string>(),
  refusalFor: () => null,
  onToggle: vi.fn(),
};

describe('FileGroup', () => {
  it('says what a whole thing costs, which is the figure being weighed', () => {
    render(<FileGroup {...props} group={programme} />);

    expect(screen.getByRole('checkbox', { name: /Pluribus/ })).toHaveAccessibleDescription(
      /2 files · 6\.0 GB/,
    );
  });

  it('keeps the files it is made of out of the way until they are asked for', () => {
    render(<FileGroup {...props} group={programme} />);

    expect(screen.queryByRole('checkbox', { name: /Grace/ })).toBeNull();
  });

  it('opens to them', async () => {
    render(<FileGroup {...props} group={programme} />);

    await userEvent.click(screen.getByRole('button', { name: /Show what Pluribus is made of/ }));

    expect(screen.getByRole('checkbox', { name: /Grace/ })).toBeInTheDocument();
  });

  it('names an episode by its number, so two called the same are told apart', async () => {
    render(<FileGroup {...props} group={programme} />);

    await userEvent.click(screen.getByRole('button', { name: /Show what Pluribus is made of/ }));

    expect(screen.getByRole('checkbox', { name: /S1E2 · Grace/ })).toBeInTheDocument();
  });

  it('takes everything under it when the thing itself is ticked', async () => {
    const onToggle = vi.fn();

    render(<FileGroup {...props} group={programme} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Pluribus/ }));

    expect(onToggle).toHaveBeenCalledWith(programme.items, true);
  });

  it('says it is partly taken when only some of it is', () => {
    render(<FileGroup {...props} group={programme} chosen={new Set(['item-1'])} />);

    expect(screen.getByRole('checkbox', { name: /Pluribus/ })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('says it is taken when all of it is', () => {
    render(
      <FileGroup {...props} group={programme} chosen={new Set(['item-1', 'item-2'])} />,
    );

    expect(screen.getByRole('checkbox', { name: /Pluribus/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('draws a thing made of one file as a plain row, with no fold that does nothing', () => {
    render(<FileGroup {...props} group={alone} />);

    expect(screen.queryByRole('button', { name: /is made of/ })).toBeNull();
    expect(screen.getByRole('checkbox', { name: /Azkaban/ })).toBeInTheDocument();
  });

  it('says why a file would be turned away, against the file it is about', () => {
    render(
      <FileGroup {...props} group={alone} refusalFor={() => 'Somebody is watching it now.'} />,
    );

    expect(screen.getByRole('checkbox', { name: /Azkaban/ })).toHaveAccessibleDescription(
      /Somebody is watching it now/,
    );
  });

  it('names the codec the way a person writes it', () => {
    render(<FileGroup {...props} group={alone} />);

    expect(screen.getByRole('checkbox', { name: /Azkaban/ })).toHaveAccessibleDescription(/HEVC/);
  });
});
