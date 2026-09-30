import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DialogDemo } from './DialogDemo';

describe('DialogDemo', () => {
  it('opens a dialog and closes it again', async () => {
    render(<DialogDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Open a dialog' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogDemo.displayName).toBe('DialogDemo');
  });
});
