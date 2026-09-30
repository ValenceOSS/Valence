import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TabsDemo } from './TabsDemo';

describe('TabsDemo', () => {
  it('shows the panel of the chosen tab', async () => {
    render(<TabsDemo />);

    expect(screen.getByText('Every film in the library, newest first.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Music' }));

    expect(
      await screen.findByText('Albums and artists, and what you played last.'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TabsDemo.displayName).toBe('TabsDemo');
  });
});
