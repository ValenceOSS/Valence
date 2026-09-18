import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Equaliser } from './Equaliser';

describe('Equaliser', () => {
  it('says what it marks', () => {
    render(<Equaliser label="Playing" />);

    expect(screen.getByRole('img', { name: 'Playing' })).toBeInTheDocument();
  });

  it('draws four bars', () => {
    render(<Equaliser label="Playing" isMoving={false} />);

    expect(screen.getByRole('img', { name: 'Playing' }).children).toHaveLength(4);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Equaliser.displayName).toBe('Equaliser');
  });
});
