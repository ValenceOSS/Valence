import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DialogCompanionDemo } from './DialogCompanionDemo';

describe('DialogCompanionDemo', () => {
  it('opens a companion from the dialog', async () => {
    render(<DialogCompanionDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Open a dialog' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Open its companion' }));

    expect(await screen.findByText('Louise Banks')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogCompanionDemo.displayName).toBe('DialogCompanionDemo');
  });
});
