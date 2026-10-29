import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { LandingLink } from './LandingLink';

describe('LandingLink', () => {
  it('takes a page on this site through the router, and says when it is used', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    const { router } = await renderWithRoutes(() => (
      <LandingLink to="/tour" className="font-medium" onClick={onClick}>
        Product tour
      </LandingLink>
    ));

    const link = screen.getByRole('link', { name: 'Product tour' });

    expect(link).toHaveAttribute('href', '/tour');
    expect(link).toHaveClass('font-medium');

    await user.click(link);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe('/tour');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingLink.displayName).toBe('LandingLink');
  });
});
