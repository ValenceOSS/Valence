import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CountMark } from './CountMark';

describe('CountMark', () => {
  it('says how many more there are, named for anybody who cannot see it', () => {
    render(<CountMark count={3} label="3 more servers have it" />);

    expect(screen.getByRole('img', { name: '3 more servers have it' })).toHaveTextContent('+3');
  });

  it('takes the size and ring of what it ends', () => {
    render(<CountMark count={1} label="1 more" className="size-8 ring-2" />);

    expect(screen.getByRole('img', { name: '1 more' })).toHaveClass('size-8', 'ring-2');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CountMark.displayName).toBe('CountMark');
  });
});
