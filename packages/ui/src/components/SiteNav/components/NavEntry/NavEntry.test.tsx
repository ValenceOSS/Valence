import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Package as PackageIcon } from '@keyline-icons/react/fill';
import { describe, expect, it, vi } from 'vitest';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import type { NavItem } from '@ValenceUI/SiteNav.types';
import { NavEntry } from './NavEntry';

/**
 * Stands in for a site's own router link, marking which links went through it.
 */
const InSite = ({ to, className, children, onClick, onPointerEnter }: InSiteLinkProps) => (
  <a
    href={to}
    data-in-site=""
    className={className}
    onClick={onClick}
    onPointerEnter={onPointerEnter}
  >
    {children}
  </a>
);

const LOCAL: NavItem = {
  site: 'landing',
  path: '/tour',
  label: 'ui.siteNav.productTour',
  detail: 'ui.siteNav.productTourDetail',
  icon: PackageIcon,
};

const AWAY: NavItem = {
  site: 'docs',
  path: '/',
  label: 'ui.siteNav.documentation',
  detail: 'ui.siteNav.documentationDetail',
  icon: PackageIcon,
};

describe('NavEntry', () => {
  it('takes a page on this site through the site’s own link, and says what is there', () => {
    render(
      <NavEntry item={LOCAL} here="landing" InSiteLink={InSite} size="panel" onChoose={vi.fn()} />,
    );

    const link = screen.getByRole('link', { name: /Product tour/ });

    expect(link).toHaveAttribute('href', '/tour');
    expect(link).toHaveAttribute('data-in-site');
    expect(
      screen.getByText('Watching, listening, reading, requests, household and admin surfaces.'),
    ).toBeInTheDocument();
  });

  it('lets a link that leaves the site go as a plain link', () => {
    render(
      <NavEntry item={AWAY} here="landing" InSiteLink={InSite} size="menu" onChoose={vi.fn()} />,
    );

    expect(screen.getByRole('link', { name: /Documentation/ })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app',
    );
  });

  it('leads back to the main site’s pages from a sister site', () => {
    render(
      <NavEntry item={LOCAL} here="metrics" InSiteLink={InSite} size="panel" onChoose={vi.fn()} />,
    );

    expect(screen.getByRole('link', { name: /Product tour/ })).toHaveAttribute(
      'href',
      'https://getvalence.app/tour',
    );
  });

  it('says when it is chosen and when it is aimed at', async () => {
    const onChoose = vi.fn();
    const onAim = vi.fn();
    const user = userEvent.setup();

    render(
      <NavEntry
        item={LOCAL}
        here="landing"
        InSiteLink={InSite}
        size="panel"
        onChoose={onChoose}
        onAim={onAim}
      />,
    );

    const link = screen.getByRole('link', { name: /Product tour/ });

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
