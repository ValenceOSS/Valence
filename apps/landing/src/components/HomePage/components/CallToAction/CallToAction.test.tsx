import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallToAction } from './CallToAction';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CallToAction', () => {
  it('offers a way to get started', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();

    render(<CallToAction />);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(open).toHaveBeenCalledWith(
      'https://github.com/MarquesCoding/Valence',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CallToAction.displayName).toBe('CallToAction');
  });
});
