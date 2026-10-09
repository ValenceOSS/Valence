import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NarrationAskCard } from './NarrationAskCard';

const NARRATIONS = [
  { asin: 'A', narrators: ['Ann Reader'], runtimeMinutes: 732, series: null },
  { asin: 'B', narrators: ['Bob Voice'], runtimeMinutes: null, series: null },
];

describe('NarrationAskCard', () => {
  it('asks which narration to fetch, one or all of them', async () => {
    const onDecide = vi.fn();
    const user = userEvent.setup();

    render(
      <NarrationAskCard
        title="A Book"
        narrations={NARRATIONS}
        isBusy={false}
        onDecide={onDecide}
      />,
    );

    expect(screen.getByText('Which narration of A Book?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Read by Ann Reader, 12 h 12 min' }));
    await user.click(screen.getByRole('button', { name: 'All of them' }));

    expect(onDecide.mock.calls).toEqual([[['A']], [['A', 'B']]]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NarrationAskCard.displayName).toBe('NarrationAskCard');
  });
});
