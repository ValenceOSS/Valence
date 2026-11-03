import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArtworkCloseButton } from './ArtworkCloseButton';

describe('ArtworkCloseButton', () => {
  it('closes the dialog', async () => {
    const onClose = vi.fn();

    render(<ArtworkCloseButton onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ArtworkCloseButton.displayName).toBe('ArtworkCloseButton');
  });
});
