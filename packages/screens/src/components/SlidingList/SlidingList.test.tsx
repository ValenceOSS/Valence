import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SlidingList } from './SlidingList';

const rows = [
  { id: 'a', title: '1. I Was Stolen Away' },
  { id: 'b', title: '2. I Died' },
];

describe('SlidingList', () => {
  it('lists each item, in order, under its name', () => {
    render(
      <SlidingList
        label="Episodes"
        items={rows}
        keyOf={(row) => row.id}
        renderItem={(row) => <span>{row.title}</span>}
      />,
    );

    const items = within(screen.getByRole('list', { name: 'Episodes' })).getAllByRole('listitem');

    expect(items.map((item) => item.textContent)).toEqual(['1. I Was Stolen Away', '2. I Died']);
  });

  it('marks each row for the highlight to find', () => {
    render(
      <SlidingList
        items={rows}
        keyOf={(row) => row.id}
        renderItem={(row) => <span>{row.title}</span>}
      />,
    );

    expect(
      screen.getAllByRole('listitem').map((item) => item.getAttribute('data-highlight')),
    ).toEqual(['a', 'b']);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SlidingList.displayName).toBe('SlidingList');
  });
});
