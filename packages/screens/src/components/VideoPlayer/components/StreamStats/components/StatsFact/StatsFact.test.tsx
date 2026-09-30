import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsFact } from './StatsFact';

const draw = (fact: Parameters<typeof StatsFact>[0]) =>
  render(
    <dl>
      <StatsFact {...fact} />
    </dl>,
  );

describe('StatsFact', () => {
  it('names a fact and gives its value', () => {
    draw({ name: 'Range', value: 'HDR10' });

    expect(screen.getByText('Range').nextElementSibling).toHaveTextContent('HDR10');
  });

  it('shows a dash for something not known yet', () => {
    draw({ name: 'Range', value: null });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('keeps the whole of a long code on hover where it is cut short', () => {
    draw({ name: 'Session', value: 'a-very-long-session-id', isCode: true });

    expect(screen.getByTitle('a-very-long-session-id')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatsFact.displayName).toBe('StatsFact');
  });
});
