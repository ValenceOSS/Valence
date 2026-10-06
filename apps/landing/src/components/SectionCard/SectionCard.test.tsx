import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionCard } from './SectionCard';

describe('SectionCard', () => {
  it('holds what sits on it in a rounded card darker than the page', () => {
    render(
      <SectionCard>
        <p>On the card</p>
      </SectionCard>,
    );

    const card = screen.getByText('On the card').parentElement;

    expect(card).toHaveClass('rounded-[2rem]', 'bg-surface');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SectionCard.displayName).toBe('SectionCard');
  });
});
