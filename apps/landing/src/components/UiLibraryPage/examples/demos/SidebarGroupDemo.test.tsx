import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SidebarGroupDemo } from './SidebarGroupDemo';

describe('SidebarGroupDemo', () => {
  it('marks the place chosen', async () => {
    render(<SidebarGroupDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Books' }));

    expect(screen.getByRole('button', { name: 'Books' })).toHaveAttribute('aria-current', 'page');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SidebarGroupDemo.displayName).toBe('SidebarGroupDemo');
  });
});
