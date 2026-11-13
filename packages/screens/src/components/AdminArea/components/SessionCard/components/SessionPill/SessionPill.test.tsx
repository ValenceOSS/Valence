import { render, screen } from '@testing-library/react';
import { Play as PlayIcon } from '@keyline-icons/react/fill';
import { describe, expect, it } from 'vitest';
import { SessionPill } from './SessionPill';

describe('SessionPill', () => {
  it('says its word in a frosted pill in the top left of the artwork', () => {
    render(<SessionPill glyph={PlayIcon}>Playing</SessionPill>);

    const pill = screen.getByText('Playing');

    expect(pill).toHaveClass('bg-shade/45');
    expect(pill).toHaveClass('backdrop-blur-md');
    expect(pill).toHaveClass('start-[clamp(8px,3.4cqw,16px)]');
    expect(pill.querySelector('svg')).not.toBeNull();
  });

  it('sits in the top right when asked to, with no mark where it has none', () => {
    render(<SessionPill side="right">Direct play</SessionPill>);

    const pill = screen.getByText('Direct play');

    expect(pill).toHaveClass('end-[clamp(8px,3.4cqw,16px)]');
    expect(pill.querySelector('svg')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionPill.displayName).toBe('SessionPill');
  });
});
