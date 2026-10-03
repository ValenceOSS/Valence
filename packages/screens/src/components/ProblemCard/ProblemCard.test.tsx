import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Compass as CompassIcon } from '@keyline-icons/react/fill';
import { ProblemCard } from './ProblemCard';

describe('ProblemCard', () => {
  it('says what went wrong and why, with the ways out beneath', () => {
    render(
      <ProblemCard
        icon={CompassIcon}
        headline="Page not found"
        reason="It may have moved."
        actions={<button type="button">Go back</button>}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('It may have moved.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });

  it('shows what the error said, where there is something to show', () => {
    const { rerender } = render(
      <ProblemCard
        icon={CompassIcon}
        headline="Broken"
        reason="Why."
        said="TypeError: x"
        actions={null}
      />,
    );

    expect(screen.getByText('TypeError: x').tagName).toBe('PRE');

    rerender(
      <ProblemCard icon={CompassIcon} headline="Broken" reason="Why." said="" actions={null} />,
    );

    expect(document.querySelector('pre')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProblemCard.displayName).toBe('ProblemCard');
  });
});
