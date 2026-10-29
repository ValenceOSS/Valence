import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import { NavLink } from './NavLink';

/**
 * Stands in for a site's own router link, marking which links went through it.
 */
const InSite = ({ to, className, children, onClick }: InSiteLinkProps) => (
  <a href={to} data-in-site="" className={className} onClick={onClick}>
    {children}
  </a>
);

describe('NavLink', () => {
  it('reaches a page on this site through the site’s own link', () => {
    render(
      <NavLink
        target={{ site: 'landing', path: '/tour' }}
        here="landing"
        InSiteLink={InSite}
        className=""
      >
        Tour
      </NavLink>,
    );

    const link = screen.getByRole('link', { name: 'Tour' });

    expect(link).toHaveAttribute('href', '/tour');
    expect(link).toHaveAttribute('data-in-site');
  });

  it('leads to a sister site by its whole address, in this same tab', () => {
    render(
      <NavLink
        target={{ site: 'landing', path: '/tour' }}
        here="metrics"
        InSiteLink={InSite}
        className=""
      >
        Tour
      </NavLink>,
    );

    const link = screen.getByRole('link', { name: 'Tour' });

    expect(link).toHaveAttribute('href', 'https://getvalence.app/tour');
    expect(link).not.toHaveAttribute('data-in-site');
    expect(link).not.toHaveAttribute('target');
  });

  it('says when it is followed', () => {
    const onClick = vi.fn();

    render(
      <NavLink
        target={{ site: 'landing', path: '/tour' }}
        here="landing"
        InSiteLink={InSite}
        className=""
        onClick={onClick}
      >
        Tour
      </NavLink>,
    );

    const link = screen.getByRole('link', { name: 'Tour' });

    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
    fireEvent.click(link);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NavLink.displayName).toBe('NavLink');
  });
});
