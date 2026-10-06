import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhoneFan } from './PhoneFan';

describe('PhoneFan', () => {
  it('fans out five screens of the phone app under what it is for', () => {
    render(<PhoneFan />);

    expect(screen.getByRole('heading', { name: /In your pocket/ })).toBeInTheDocument();

    for (const screenName of ['Your books', 'Music home', 'Now playing', 'Home', 'Your films']) {
      expect(screen.getByRole('img', { name: screenName })).toBeInTheDocument();
    }
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PhoneFan.displayName).toBe('PhoneFan');
  });
});
