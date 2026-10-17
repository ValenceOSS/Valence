import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatisticsRangeChoice } from './StatisticsRangeChoice';

describe('StatisticsRangeChoice', () => {
  it('shows the range chosen', () => {
    render(<StatisticsRangeChoice value="month" onChange={vi.fn()} />);

    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });
});
