import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarButtonGroup } from './BarButtonGroup';

describe('BarButtonGroup', () => {
  it('holds the buttons it is given', () => {
    render(
      <BarButtonGroup>
        <div>
          <button type="button">Bell</button>
        </div>
      </BarButtonGroup>,
    );

    expect(screen.getByRole('button', { name: 'Bell' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BarButtonGroup.displayName).toBe('BarButtonGroup');
  });
});
