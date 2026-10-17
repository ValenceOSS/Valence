import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MenuItemFace } from './MenuItemFace';

describe('MenuItemFace', () => {
  it('says what the item does, with a note at the end', () => {
    render(<MenuItemFace item={{ id: 'a', label: 'Rename', detail: 'F2', onChoose: vi.fn() }} />);

    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('F2')).toBeInTheDocument();
  });

  it('ticks the item that is in force', () => {
    const { container } = render(
      <MenuItemFace item={{ id: 'a', label: 'Grid', isCurrent: true, onChoose: vi.fn() }} />,
    );

    expect(container.querySelector('.valence-icon')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MenuItemFace.displayName).toBe('MenuItemFace');
  });
});
