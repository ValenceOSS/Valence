import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InfoHeading } from './InfoHeading';

describe('InfoHeading', () => {
  it('says what the card is about, set off from the rows by a rule', () => {
    render(<InfoHeading>3 Oct, 04:47</InfoHeading>);

    expect(screen.getByText('3 Oct, 04:47')).toHaveClass('border-b', 'text-text-muted');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(InfoHeading.displayName).toBe('InfoHeading');
  });
});
