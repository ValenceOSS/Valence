import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DrawerDemo } from './DrawerDemo';

describe('DrawerDemo', () => {
  it('slides the drawer in', async () => {
    render(<DrawerDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Open the drawer' }));

    expect(
      await screen.findByText('A drawer holds what sits beside the page.'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DrawerDemo.displayName).toBe('DrawerDemo');
  });
});
