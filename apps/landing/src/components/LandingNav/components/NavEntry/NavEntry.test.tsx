import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Package as PackageIcon } from '@keyline-icons/react/fill';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { NavEntry } from './NavEntry';

const LOCAL = {
  to: '/tour',
  label: 'Product tour',
  detail: 'Every surface, one at a time.',
  icon: PackageIcon,
};

const AWAY = {
  href: 'https://docs.getvalence.app',
  label: 'Documentation',
  detail: 'Install guides and reference pages.',
  icon: PackageIcon,
};

describe('NavEntry', () => {
  it('takes a page on this site through the router, and says what is there', async () => {
    await renderWithRoutes(() => <NavEntry item={LOCAL} size="panel" onChoose={vi.fn()} />);

    expect(screen.getByRole('link', { name: /Product tour/ })).toHaveAttribute('href', '/tour');
    expect(screen.getByText('Every surface, one at a time.')).toBeInTheDocument();
  });

  it('lets a link that leaves the site go as a plain link', async () => {
    await renderWithRoutes(() => <NavEntry item={AWAY} size="menu" onChoose={vi.fn()} />);

    expect(screen.getByRole('link', { name: /Documentation/ })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app',
    );
  });

  it('says when it is chosen and when it is aimed at', async () => {
    const onChoose = vi.fn();
    const onAim = vi.fn();
    const user = userEvent.setup();

    await renderWithRoutes(() => (
      <NavEntry item={AWAY} size="panel" onChoose={onChoose} onAim={onAim} />
    ));

    const link = screen.getByRole('link', { name: /Documentation/ });

    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await user.hover(link);
    await user.click(link);

    expect(onAim).toHaveBeenCalled();
    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NavEntry.displayName).toBe('NavEntry');
  });
});
