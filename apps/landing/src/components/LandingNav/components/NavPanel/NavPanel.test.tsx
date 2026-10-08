import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { NAV_GROUPS } from '@ValenceLanding/components/LandingNav/NAV_GROUPS';
import { NavPanel } from './NavPanel';

const [PRODUCT] = NAV_GROUPS;

describe('NavPanel', () => {
  it('names the section and says what it is for', async () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    await renderWithRoutes(() => (
      <NavPanel group={PRODUCT} direction={0} onChoose={vi.fn()} onMeasure={vi.fn()} />
    ));

    expect(screen.getByRole('region', { name: 'Product' })).toBeInTheDocument();
    expect(screen.getByText(PRODUCT.blurb)).toBeInTheDocument();
  });

  it('lists every place in the section', async () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    await renderWithRoutes(() => (
      <NavPanel group={PRODUCT} direction={1} onChoose={vi.fn()} onMeasure={vi.fn()} />
    ));

    for (const item of PRODUCT.items) {
      expect(screen.getByRole('link', { name: new RegExp(item.label) })).toBeInTheDocument();
    }
  });

  it('says when a place is chosen, so the bar can close', async () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    const onChoose = vi.fn();
    const user = userEvent.setup();

    await renderWithRoutes(() => (
      <NavPanel group={PRODUCT} direction={-1} onChoose={onChoose} onMeasure={vi.fn()} />
    ));

    await user.click(screen.getByRole('link', { name: /Plugins/ }));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('says how tall it is, so the bar can grow to fit it', async () => {
    if (PRODUCT === undefined) {
      throw new Error('There is no product section to lay out.');
    }

    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 264,
    });
    const onMeasure = vi.fn();

    await renderWithRoutes(() => (
      <NavPanel group={PRODUCT} direction={0} onChoose={vi.fn()} onMeasure={onMeasure} />
    ));
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');

    expect(onMeasure).toHaveBeenCalledWith(264);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NavPanel.displayName).toBe('NavPanel');
  });
});
