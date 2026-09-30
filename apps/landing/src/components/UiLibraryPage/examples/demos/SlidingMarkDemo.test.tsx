import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SlidingMarkDemo } from './SlidingMarkDemo';

describe('SlidingMarkDemo', () => {
  it('moves the mark to the chosen one', async () => {
    render(<SlidingMarkDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Year' }));

    expect(screen.getByRole('button', { name: 'Year' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SlidingMarkDemo.displayName).toBe('SlidingMarkDemo');
  });
});
