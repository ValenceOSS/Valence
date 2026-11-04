import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PRE_TRANSCODE_TARGET } from '@ValenceContracts/schemas/PreTranscoding';
import { LadderTable } from './LadderTable';
import type { DraftRung } from './LadderTable.types';

const rung = (id: string, extra: Partial<DraftRung> = {}): DraftRung => ({
  id,
  target: DEFAULT_PRE_TRANSCODE_TARGET,
  bitrate: '',
  progress: null,
  replacesOriginal: false,
  ...extra,
});

const handlers = () => ({
  onChange: vi.fn(),
  onBitrateChange: vi.fn(),
  onRemove: vi.fn(),
  onReorder: vi.fn(),
});

describe('LadderTable', () => {
  it('says how far a rung has got and how much it keeps, once saved', () => {
    render(
      <LadderTable
        rungs={[
          rung('a', {
            progress: {
              target: DEFAULT_PRE_TRANSCODE_TARGET,
              replacesOriginal: false,
              copiesMade: 3,
              bytesKept: 0,
              stillNeeded: 7,
              givenUp: 0,
            },
          }),
        ]}
        {...handlers()}
      />,
    );

    expect(screen.getByText('3 of 10')).toBeInTheDocument();
  });

  it('takes a rung’s bitrate ceiling from the menu of limits', async () => {
    const on = handlers();
    const user = userEvent.setup();

    render(<LadderTable rungs={[rung('a'), rung('b')]} {...on} />);

    const first = screen.getAllByRole('row')[1];

    if (first === undefined) {
      throw new Error('The ladder drew no rows.');
    }

    await user.click(within(first).getByRole('button', { name: /Bitrate ceiling/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: '1 Mb/s' }));

    expect(on.onBitrateChange).toHaveBeenCalledWith('a', '1000');
  });

  it('removes a rung', async () => {
    const on = handlers();
    const user = userEvent.setup();

    render(<LadderTable rungs={[rung('a'), rung('b')]} {...on} />);

    const removes = screen.getAllByRole('button', { name: /^Remove the/ });

    await user.click(removes[1] ?? removes[0] ?? document.body);

    expect(on.onRemove).toHaveBeenCalledWith('b');
  });

  it('never removes the last rung', () => {
    render(<LadderTable rungs={[rung('a')]} {...handlers()} />);

    expect(screen.getByRole('button', { name: /^Remove the/ })).toBeDisabled();
  });

  it('offers the usual limit for the quality first, and goes back to it', async () => {
    const on = handlers();
    const user = userEvent.setup();

    render(<LadderTable rungs={[rung('a', { bitrate: '1000' })]} {...on} />);

    await user.click(screen.getByRole('button', { name: /Bitrate ceiling/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: /^Automatic/ }));

    expect(on.onBitrateChange).toHaveBeenCalledWith('a', '');
  });

  it('marks the rung that replaces the original', () => {
    render(<LadderTable rungs={[rung('a', { replacesOriginal: true })]} {...handlers()} />);

    expect(screen.getByText('Replaces the original')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LadderTable.displayName).toBe('LadderTable');
  });
});
