import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArtworkBackButton } from './ArtworkBackButton';

describe('ArtworkBackButton', () => {
  it('goes back to where it says', async () => {
    const onBack = vi.fn();

    render(<ArtworkBackButton label="Back to Severance" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Back to Severance' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ArtworkBackButton.displayName).toBe('ArtworkBackButton');
  });
});
