import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import { NAV_GROUPS } from '@ValenceUI/SiteNav/NAV_GROUPS';
import { say } from '@ValenceI18n/say';
import { NavPanel } from './NavPanel';

const [PRODUCT] = NAV_GROUPS;

/**
 * Stands in for a site's own router link.
 */
const InSite = ({ to, className, children, onClick }: InSiteLinkProps) => (
  <a href={to} className={className} onClick={onClick}>
    {children}
  </a>
);

describe('NavPanel', () => {
  it('names the section and says what it is for', () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    render(
      <NavPanel
        group={PRODUCT}
        here="landing"
        InSiteLink={InSite}
        direction={0}
        onChoose={vi.fn()}
        onMeasure={vi.fn()}
      />,
    );

    expect(screen.getByRole('region', { name: 'Product' })).toBeInTheDocument();
    expect(screen.getByText(say(PRODUCT.blurb))).toBeInTheDocument();
  });

  it('lists every place in the section', () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    render(
      <NavPanel
        group={PRODUCT}
        here="landing"
        InSiteLink={InSite}
        direction={1}
        onChoose={vi.fn()}
        onMeasure={vi.fn()}
      />,
    );

    for (const item of PRODUCT.items) {
      expect(screen.getByRole('link', { name: new RegExp(say(item.label)) })).toBeInTheDocument();
    }
  });

  it('says when a place is chosen, so the bar can close', async () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    const onChoose = vi.fn();
    const user = userEvent.setup();

    render(
      <NavPanel
        group={PRODUCT}
        here="landing"
        InSiteLink={InSite}
        direction={-1}
        onChoose={onChoose}
        onMeasure={vi.fn()}
      />,
    );

    const plugins = screen.getByRole('link', { name: /Plugins/ });

    plugins.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await user.click(plugins);

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('says how tall it is, so the bar can grow to fit it', () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 264,
    });
    const onMeasure = vi.fn();

    render(
      <NavPanel
        group={PRODUCT}
        here="landing"
        InSiteLink={InSite}
        direction={0}
        onChoose={vi.fn()}
        onMeasure={onMeasure}
      />,
    );
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');

    expect(onMeasure).toHaveBeenCalledWith(264);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NavPanel.displayName).toBe('NavPanel');
  });
});
