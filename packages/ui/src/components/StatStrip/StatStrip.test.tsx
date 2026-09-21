import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatStrip } from './StatStrip';

const ITEMS = [
  { id: 'events', label: 'Events', value: '1,204' },
  { id: 'errors', label: 'Errors', value: '24', isAlarming: true, detail: 'Since yesterday' },
  { id: 'trend', label: 'Warnings', value: '3', history: <span>a history</span> },
];

describe('StatStrip', () => {
  it('lists each figure with what it is', () => {
    render(<StatStrip label="How the log stands" items={ITEMS} />);

    expect(screen.getByLabelText('How the log stands')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('1,204')).toBeInTheDocument();
    expect(screen.getByText('Since yesterday')).toBeInTheDocument();
  });

  it('draws an alarming figure in the colour of danger, and no other', () => {
    render(<StatStrip label="How the log stands" items={ITEMS} />);

    expect(screen.getByText('24')).toHaveClass('text-danger');
    expect(screen.getByText('1,204')).not.toHaveClass('text-danger');
  });

  it('draws a history behind a figure, hidden from assistive technology', () => {
    render(<StatStrip label="How the log stands" items={ITEMS} />);

    expect(screen.getByText('a history').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws no box of its own, so it is never a card', () => {
    const { container } = render(<StatStrip label="How the log stands" items={ITEMS} />);

    expect(container.querySelector('.valence-card-shell, .valence-card-face')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatStrip.displayName).toBe('StatStrip');
  });
});
