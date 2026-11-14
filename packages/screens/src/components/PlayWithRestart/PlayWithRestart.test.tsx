import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlayWithRestart } from './PlayWithRestart';

describe('PlayWithRestart', () => {
  it('starts it again from the beginning', async () => {
    const onStartAgain = vi.fn();

    render(
      <PlayWithRestart onStartAgain={onStartAgain}>
        <span>Play</span>
      </PlayWithRestart>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Start again' }));

    expect(onStartAgain).toHaveBeenCalledOnce();
  });

  it('draws the play button alone where there is nothing to carry on from', () => {
    render(
      <PlayWithRestart>
        <span>Play</span>
      </PlayWithRestart>,
    );

    expect(screen.getByText('Play')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start again' })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlayWithRestart.displayName).toBe('PlayWithRestart');
  });

  it('joins anything more on at the end, shaped to close the control', () => {
    render(
      <PlayWithRestart
        onStartAgain={vi.fn()}
        size="md"
        more={(shape) => (
          <button type="button" className={shape}>
            More
          </button>
        )}
      >
        <span>Play</span>
      </PlayWithRestart>,
    );

    expect(screen.getByRole('button', { name: 'More' })).toHaveClass(
      'rounded-s-[4px]',
      'rounded-e-[0.75rem]',
    );
    expect(screen.getByRole('button', { name: 'Start again' })).toHaveClass('rounded-e-[4px]');
  });
});
