import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MeterTile } from './MeterTile';

describe('MeterTile', () => {
  it('names the figure and gives it', () => {
    render(<MeterTile label="Memory" value="38 GB" fraction={0.8} />);

    expect(screen.getByRole('heading', { name: 'Memory' })).toBeInTheDocument();
    expect(screen.getByText('38 GB')).toBeInTheDocument();
  });

  it('gives a line qualifying the figure where there is one', () => {
    render(<MeterTile label="Storage" value="1.2 TB" detail="of 4 TB" />);

    expect(screen.getByText('of 4 TB')).toBeInTheDocument();
  });

  it('draws no meter without a fraction', () => {
    const { container } = render(<MeterTile label="Graphics" value="—" />);

    expect(container.querySelector('span[aria-hidden].flex')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MeterTile.displayName).toBe('MeterTile');
  });
});
