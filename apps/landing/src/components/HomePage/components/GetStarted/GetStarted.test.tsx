import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GetStarted } from './GetStarted';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GetStarted', () => {
  it('asks whether the reader is ready, where getting started leads', () => {
    render(<GetStarted />);

    expect(screen.getByRole('heading', { name: 'Ready to get started?' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Get started' })).toHaveAttribute('id', 'download');
  });

  it('sends somebody to the quick start or the demo', async () => {
    const assign = vi.fn();

    vi.stubGlobal('location', { ...window.location, assign });

    const user = userEvent.setup();

    render(<GetStarted />);

    await user.click(screen.getByRole('button', { name: /Install Valence/ }));
    await user.click(screen.getByRole('button', { name: 'Try the demo' }));

    expect(assign).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/start\/quick-start$/u));
    expect(assign).toHaveBeenCalledTimes(2);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GetStarted.displayName).toBe('GetStarted');
  });
});
