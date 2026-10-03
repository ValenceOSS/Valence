import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadFigure } from './LoadFigure';

describe('LoadFigure', () => {
  it('names a figure quietly and gives its value large beneath it', () => {
    render(
      <dl>
        <LoadFigure label="Peak">80%</LoadFigure>
      </dl>,
    );

    expect(screen.getByText('Peak').tagName).toBe('DT');
    expect(screen.getByText('Peak').nextElementSibling).toHaveTextContent('80%');
    expect(screen.getByText('80%')).toHaveClass('text-lg', 'tabular-nums');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LoadFigure.displayName).toBe('LoadFigure');
  });
});
