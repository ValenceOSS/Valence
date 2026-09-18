import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExplicitMark } from './ExplicitMark';

describe('ExplicitMark', () => {
  it('says what it marks', () => {
    render(<ExplicitMark />);

    expect(screen.getByRole('img', { name: 'Explicit' })).toHaveTextContent('E');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ExplicitMark.displayName).toBe('ExplicitMark');
  });
});
