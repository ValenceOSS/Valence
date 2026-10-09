import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyableCommands } from './CopyableCommands';

afterEach(() => {
  vi.useRealTimers();
});

describe('CopyableCommands', () => {
  it('sets each command on a line of its own, named for what they do', () => {
    render(<CopyableCommands commands={'mkdir valence\ndocker compose up -d'} label="Start it" />);

    expect(screen.getByRole('figure', { name: 'Start it' })).toBeInTheDocument();
    expect(screen.getByText('mkdir valence')).toBeInTheDocument();
    expect(screen.getByText('docker compose up -d')).toBeInTheDocument();
  });

  it('copies every line at once, says so, then settles back', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    render(<CopyableCommands commands={'mkdir valence\ndocker compose up -d'} label="Start it" />);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    await user.click(screen.getByRole('button', { name: 'Copy the commands' }));

    expect(writeText).toHaveBeenCalledWith('mkdir valence\ndocker compose up -d');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: 'Copy the commands' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CopyableCommands.displayName).toBe('CopyableCommands');
  });
});
