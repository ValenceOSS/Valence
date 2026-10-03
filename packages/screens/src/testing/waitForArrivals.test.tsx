import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { waitForArrivals } from './waitForArrivals';

describe('waitForArrivals', () => {
  it('waits until a card that rises in can be seen', async () => {
    render(
      <PanelCard title="Storage">
        <p>Inside</p>
      </PanelCard>,
    );

    await waitForArrivals();

    expect(screen.getByText('Inside')).toBeVisible();
  });

  it('carries straight on where there is no card to wait for', async () => {
    render(<p>Plain</p>);

    await waitForArrivals();

    expect(screen.getByText('Plain')).toBeVisible();
  });
});
