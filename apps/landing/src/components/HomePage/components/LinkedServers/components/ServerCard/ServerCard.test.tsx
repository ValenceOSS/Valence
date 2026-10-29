import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ServerCard } from './ServerCard';

describe('ServerCard', () => {
  it('names the server, its fingerprint and what it shares', () => {
    render(
      <ServerCard
        name="Home"
        tint="accent"
        fingerprint="a3f9 21c7"
        libraries={[
          { name: 'Films', isShared: true },
          { name: 'Music', isShared: false },
        ]}
      />,
    );

    const card = screen.getByRole('article', { name: 'Home' });

    expect(card).toHaveTextContent('a3f9 21c7');
    expect(card).toHaveTextContent('FilmsShared');
    expect(card).toHaveTextContent('MusicNot shared');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ServerCard.displayName).toBe('ServerCard');
  });
});
