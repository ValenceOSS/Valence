import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShareCard } from './ShareCard';

const ROWS = [
  { id: 'linux', label: 'Linux', installs: 60, share: 0.75 },
  { id: 'other', label: 'Other', installs: 20, share: 0.25 },
];

describe('ShareCard', () => {
  it('lists each answer with its share of every server', () => {
    render(<ShareCard title="Operating system" heading="System" rows={ROWS} />);

    expect(screen.getByRole('heading', { name: 'Operating system' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Operating system' })).toBeInTheDocument();
    expect(screen.getByText('Linux')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });

  it('says so where there is nothing to show', () => {
    render(<ShareCard title="Memory" heading="Memory" rows={[]} />);

    expect(screen.getByText('Not enough servers to show yet.')).toBeInTheDocument();
  });

  it('carries a note beneath the list where it is given one', () => {
    render(<ShareCard title="Graphics" heading="Maker" rows={ROWS} note="Can add up to more." />);

    expect(screen.getByText('Can add up to more.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShareCard.displayName).toBe('ShareCard');
  });
});
