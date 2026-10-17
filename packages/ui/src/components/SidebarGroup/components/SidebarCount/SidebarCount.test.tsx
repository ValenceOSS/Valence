import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SidebarCount } from './SidebarCount';

describe('SidebarCount', () => {
  it('shows how many are waiting', () => {
    const { container } = render(<SidebarCount count={4} />);

    expect(container.textContent).toBe('4');
  });

  it('caps a large count', () => {
    const { container } = render(<SidebarCount count={250} />);

    expect(container.textContent).toBe('99+');
  });

  it('draws only a dot on a folded rail', () => {
    const { container } = render(<SidebarCount count={3} isDot isUrgent />);

    expect(container.textContent).toBe('');
    expect(container.firstElementChild?.className).toContain('bg-danger');
  });
});
