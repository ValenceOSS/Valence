import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardRegion } from './DashboardRegion';

describe('DashboardRegion', () => {
  it('shows its title and what it holds', () => {
    render(
      <DashboardRegion title="Most watched">
        <p>Severance</p>
      </DashboardRegion>,
    );

    expect(screen.getByText('Most watched')).toBeInTheDocument();
    expect(screen.getByText('Severance')).toBeInTheDocument();
  });

  it('carries the way through to its page in the corner', () => {
    const onAction = vi.fn();

    render(
      <DashboardRegion title="Most watched" action="Statistics" onAction={onAction}>
        <p>Severance</p>
      </DashboardRegion>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Statistics/ }));

    expect(onAction).toHaveBeenCalledOnce();
  });
});
