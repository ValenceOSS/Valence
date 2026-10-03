import { describe, expect, it } from 'vitest';
import { upstreamOf } from './upstreamOf';

describe('upstreamOf', () => {
  it('finds a Radix primitive’s page from the package name', () => {
    expect(upstreamOf('@radix-ui/react-dropdown-menu')).toEqual({
      name: 'Radix Dropdown Menu',
      url: 'https://www.radix-ui.com/primitives/docs/components/dropdown-menu',
    });
  });

  it('looks up the other libraries components are built on', () => {
    expect(upstreamOf('@tanstack/react-table')?.url).toBe(
      'https://tanstack.com/table/latest/docs/api/core/table',
    );
    expect(upstreamOf('motion/react')?.name).toBe('Motion');
  });

  it('has nothing to say about React, helpers or icons', () => {
    expect(upstreamOf('react')).toBeNull();
    expect(upstreamOf('class-variance-authority')).toBeNull();
    expect(upstreamOf('@keyline-icons/react')).toBeNull();
  });
});
