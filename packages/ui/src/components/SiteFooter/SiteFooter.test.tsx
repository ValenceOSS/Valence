import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter';
import type { InSiteLinkProps } from './SiteFooter.types';

/**
 * Stands in for a site's own router link, marking which links went through it.
 */
const InSite = ({ to, className, children }: InSiteLinkProps) => (
  <a href={to} data-in-site="" className={className}>
    {children}
  </a>
);

describe('SiteFooter', () => {
  it('says what it is licensed under', () => {
    render(<SiteFooter here="landing" InSiteLink={InSite} />);

    expect(screen.getByText(/MIT licensed/)).toBeInTheDocument();
  });

  it('reaches the landing pages through the landing site’s own links when it is on it', () => {
    render(<SiteFooter here="landing" InSiteLink={InSite} />);

    const privacy = screen.getByRole('link', { name: 'Privacy' });

    expect(privacy).toHaveAttribute('href', '/privacy');
    expect(privacy).toHaveAttribute('data-in-site');
    expect(screen.getByRole('link', { name: 'Quick start' })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/start/quick-start',
    );
  });

  it('reaches the docs through the docs’ own links when it is on them', () => {
    render(<SiteFooter here="docs" InSiteLink={InSite} />);

    expect(screen.getByRole('link', { name: 'Quick start' })).toHaveAttribute(
      'href',
      '/start/quick-start',
    );
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      'https://getvalence.app/terms',
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      'https://getvalence.app',
    );
  });

  it('opens the project on GitHub in a new tab', () => {
    render(<SiteFooter here="docs" InSiteLink={InSite} />);

    const github = screen.getByRole('link', { name: 'GitHub' });

    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links Marques from the footer signature', () => {
    render(<SiteFooter here="landing" InSiteLink={InSite} />);

    expect(screen.getByText(/Made with/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Marques' })).toHaveAttribute(
      'href',
      'https://mscripps.uk',
    );
  });

  it('can draw a site-provided app icon beside the name', () => {
    const { container } = render(
      <SiteFooter here="landing" InSiteLink={InSite} logoSrc="/valence-icon.png" />,
    );

    expect(container.querySelector('img[alt=""]')).toHaveAttribute('src', '/valence-icon.png');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SiteFooter.displayName).toBe('SiteFooter');
  });
});
