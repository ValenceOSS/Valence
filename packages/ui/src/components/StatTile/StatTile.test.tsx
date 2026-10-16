import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('says what the figure is, and then the figure', () => {
    render(<StatTile label="Memory" value="30 GB" />);

    expect(screen.getByRole('heading', { name: 'Memory' })).toBeInTheDocument();
    expect(screen.getByText('30 GB')).toBeInTheDocument();
  });

  it('is drawn as a card like any other, the label in the shell and the figure on its face', () => {
    render(<StatTile label="Memory" value="30 GB" />);

    expect(screen.getByRole('heading', { name: 'Memory' }).closest('section')).toHaveClass(
      'valence-card-shell',
    );
    expect(screen.getByText('30 GB').closest('.valence-card-face')).not.toBeNull();
  });

  it('qualifies the figure where it is given a line to do it with', () => {
    render(<StatTile label="Memory" value="30 GB" detail="of 48 GB" />);

    expect(screen.getByText('of 48 GB')).toBeInTheDocument();
  });

  it('draws how full it is, where the figure is part of a fixed whole', () => {
    const { container } = render(<StatTile label="Storage" value="109 GB free" fraction={0.25} />);

    expect(container.querySelector('[role="presentation"]')).toHaveStyle({ width: '25%' });
  });

  it('never draws a bar fuller than full or emptier than empty', () => {
    const { container: over } = render(<StatTile label="CPU" value="140%" fraction={1.4} />);
    const { container: under } = render(<StatTile label="CPU" value="0%" fraction={-0.2} />);

    expect(over.querySelector('[role="presentation"]')).toHaveStyle({ width: '100%' });
    expect(under.querySelector('[role="presentation"]')).toHaveStyle({ width: '0%' });
  });

  it('draws no bar at all for a figure that is not part of anything', () => {
    const { container } = render(<StatTile label="Library" value="144" />);

    expect(container.querySelector('[role="presentation"]')).toBeNull();
  });

  it('draws whatever it is given beside the label', () => {
    render(<StatTile label="Memory" value="30 GB" icon={<span data-testid="chip" />} />);

    expect(screen.getByTestId('chip')).toBeInTheDocument();
  });

  it('keeps a history behind the figure rather than in front of it', () => {
    render(<StatTile label="CPU" value="9%" history={<span data-testid="line" />} />);

    expect(screen.getByTestId('line').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatTile.displayName).toBe('StatTile');
  });
});
