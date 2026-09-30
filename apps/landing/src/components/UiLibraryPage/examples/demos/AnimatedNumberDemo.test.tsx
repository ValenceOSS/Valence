import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AnimatedNumberDemo } from './AnimatedNumberDemo';

describe('AnimatedNumberDemo', () => {
  it('steps the count', async () => {
    render(<AnimatedNumberDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'One more' }));

    expect(screen.getByRole('button', { name: 'One fewer' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnimatedNumberDemo.displayName).toBe('AnimatedNumberDemo');
  });
});
