import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import { OfflineShelf, byProgramme } from './OfflineShelf';

const aFile = (over: Partial<HeldFile> = {}): HeldFile => ({
  downloadId: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'The Third Man',
  quality: 'original',
  durationSeconds: 5940,
  ofBytes: 1_073_741_824,
  state: 'here',
  bytes: 1_073_741_824,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-08-22T00:00:00.000Z',
  hasPoster: false,
  ...over,
});

const draw = (held: HeldFile[], handlers: Partial<Parameters<typeof OfflineShelf>[0]> = {}) =>
  render(
    <OfflineShelf held={held} onWatch={vi.fn()} onDrop={vi.fn()} onPause={vi.fn()} {...handlers} />,
  );

beforeEach(() => {
  installATestClient();
});

afterEach(() => {
  forgetPlatform();
});

describe('byProgramme', () => {
  it('gathers episodes of one programme together', () => {
    const groups = byProgramme([
      aFile({ downloadId: '00000000-0000-4000-8000-00000000000a', seriesTitle: 'The Bureau' }),
      aFile({ downloadId: '00000000-0000-4000-8000-00000000000b', seriesTitle: 'The Bureau' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items).toHaveLength(2);
  });

  it('leaves films under no programme at all', () => {
    expect(byProgramme([aFile()])[0]?.title).toBeNull();
  });

  it('keeps two programmes apart', () => {
    const groups = byProgramme([
      aFile({ downloadId: '00000000-0000-4000-8000-00000000000a', seriesTitle: 'The Bureau' }),
      aFile({ downloadId: '00000000-0000-4000-8000-00000000000b', seriesTitle: 'Slow Horses' }),
    ]);

    expect(groups).toHaveLength(2);
  });
});

describe('OfflineShelf', () => {
  it('says plainly when there is nothing here, and how something gets here', () => {
    draw([]);

    expect(screen.getByText('Nothing is on this device')).toBeInTheDocument();
    expect(screen.getByText(/while Valence is reachable/)).toBeInTheDocument();
  });

  it('offers something that is here', () => {
    draw([aFile()]);

    expect(screen.getByRole('button', { name: /^The Third Man/ })).toBeInTheDocument();
  });

  it('plays the one that was pressed', async () => {
    const onWatch = vi.fn();

    draw([aFile()], { onWatch });

    await userEvent.click(screen.getByRole('button', { name: /^The Third Man/ }));

    expect(onWatch).toHaveBeenCalledWith(expect.objectContaining({ title: 'The Third Man' }));
  });

  it('shows something still arriving rather than hiding it, without playing it', async () => {
    const onWatch = vi.fn();

    draw([aFile({ state: 'fetching', bytes: 536_870_912 })], { onWatch });

    expect(screen.getByText(/Fetching — 50%/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^The Third Man/ }));

    expect(onWatch).not.toHaveBeenCalled();
  });

  it('does not play something that has not finished arriving', async () => {
    const onWatch = vi.fn();

    draw([aFile({ state: 'paused', bytes: 10 })], { onWatch });

    await userEvent.click(screen.getByRole('button', { name: /^The Third Man/ }));

    expect(onWatch).not.toHaveBeenCalled();
  });

  it('lets a transfer be stopped for now', async () => {
    const actor = userEvent.setup();
    const onPause = vi.fn();

    draw([aFile({ state: 'fetching', bytes: 10 })], { onPause });

    await actor.click(screen.getByRole('button', { name: 'More for The Third Man' }));
    await actor.click(await screen.findByRole('menuitem', { name: /Stop fetching/ }));

    expect(onPause).toHaveBeenCalledWith(expect.objectContaining({ title: 'The Third Man' }), true);
  });

  it('lets a stopped transfer be carried on with', async () => {
    const actor = userEvent.setup();
    const onPause = vi.fn();

    draw([aFile({ state: 'paused', bytes: 10 })], { onPause });

    await actor.click(screen.getByRole('button', { name: 'More for The Third Man' }));
    await actor.click(await screen.findByRole('menuitem', { name: /Carry on fetching/ }));

    expect(onPause).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'The Third Man' }),
      false,
    );
  });

  it('asks first, then lets go of something to make room', async () => {
    const actor = userEvent.setup();
    const onDrop = vi.fn();

    draw([aFile()], { onDrop });

    await actor.click(screen.getByRole('button', { name: 'More for The Third Man' }));
    await actor.click(await screen.findByRole('menuitem', { name: /Delete from this device/ }));

    expect(onDrop).not.toHaveBeenCalled();

    await actor.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ title: 'The Third Man' }));
  });

  it('says how much of a programme is actually here, which is the question before a flight', () => {
    draw([
      aFile({ downloadId: '00000000-0000-4000-8000-00000000000a', seriesTitle: 'The Bureau' }),
      aFile({
        downloadId: '00000000-0000-4000-8000-00000000000b',
        seriesTitle: 'The Bureau',
        state: 'fetching',
      }),
    ]);

    expect(screen.getByText('1 of 2 here')).toBeInTheDocument();
  });

  it('says why something failed', () => {
    draw([aFile({ state: 'failed', failure: 'The disk is full.' })]);

    expect(screen.getByText('The disk is full.')).toBeInTheDocument();
  });
});
