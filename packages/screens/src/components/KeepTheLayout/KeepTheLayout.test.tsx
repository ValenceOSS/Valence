import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeepTheLayout } from './KeepTheLayout';

/**
 * Puts the page on trial, as the server does for a television that chose the web app.
 *
 * @returns What keeping it and going back were told.
 */
const onTrial = () => {
  const keep = vi.fn();
  const goBack = vi.fn();

  window.valenceLayoutTrial = { endsAt: Date.now() + 10_000, keep, goBack };

  return { keep, goBack };
};

afterEach(() => {
  window.valenceLayoutTrial = undefined;
});

describe('KeepTheLayout', () => {
  it('asks nothing of a page that is not on trial', () => {
    render(<KeepTheLayout />);

    expect(screen.queryByText('Keep the desktop layout?')).not.toBeInTheDocument();
  });

  it('counts down to going back, starting the remote on keeping it', async () => {
    onTrial();
    render(<KeepTheLayout />);

    expect(
      screen.getByText(
        'Valence goes back to the TV layout in 10 seconds unless you keep this one.',
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Keep the desktop layout' })).toHaveFocus();
    });
  });

  it('takes the remote back from a page behind that grabs it as it draws', async () => {
    onTrial();

    const field = document.createElement('input');

    document.body.append(field);
    render(<KeepTheLayout />);
    field.focus();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Keep the desktop layout' })).toHaveFocus();
    });
    field.remove();
  });

  it('moves between the answers with the remote’s arrows', async () => {
    onTrial();
    render(<KeepTheLayout />);

    const keepIt = screen.getByRole('button', { name: 'Keep the desktop layout' });

    await waitFor(() => {
      expect(keepIt).toHaveFocus();
    });
    fireEvent.keyDown(keepIt, { key: 'ArrowRight' });

    expect(screen.getByRole('button', { name: 'Go back to the TV layout' })).toHaveFocus();
  });

  it('keeps the layout when asked, and asks no more', () => {
    const { keep, goBack } = onTrial();

    render(<KeepTheLayout />);
    fireEvent.click(screen.getByRole('button', { name: 'Keep the desktop layout' }));

    expect(keep).toHaveBeenCalledOnce();
    expect(goBack).not.toHaveBeenCalled();
    expect(screen.queryByText('Keep the desktop layout?')).not.toBeInTheDocument();
  });

  it('goes back straight away when asked', () => {
    const { goBack } = onTrial();

    render(<KeepTheLayout />);
    fireEvent.click(screen.getByRole('button', { name: 'Go back to the TV layout' }));

    expect(goBack).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(KeepTheLayout.displayName).toBe('KeepTheLayout');
  });
});
