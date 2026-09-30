import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ConfirmDialogDemo } from './ConfirmDialogDemo';

describe('ConfirmDialogDemo', () => {
  it('asks before removing', async () => {
    render(<ConfirmDialogDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove library' }));

    expect(await screen.findByText('Remove this library?')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ConfirmDialogDemo.displayName).toBe('ConfirmDialogDemo');
  });
});
