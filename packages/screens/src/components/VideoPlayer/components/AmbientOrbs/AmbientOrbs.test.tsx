import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AMBIENT_GRID } from '@ValenceScreens/playback/AMBIENT_GRID';
import { AmbientOrbs } from './AmbientOrbs';

vi.mock('@ValenceScreens/playback/useAmbientLights', () => ({
  useAmbientLights: () =>
    Array.from({ length: 140 }, (_, cell) => (cell === 0 ? 'rgb(255 0 0)' : 'rgb(9 9 9)')),
}));

const edgeCells = 2 * AMBIENT_GRID.columns + 2 * (AMBIENT_GRID.rows - 2);

describe('AmbientOrbs', () => {
  it('draws an orb for each cell around the edge of the picture', () => {
    const { container } = render(<AmbientOrbs videoRef={{ current: null }} />);

    expect(container.querySelectorAll('span')).toHaveLength(edgeCells);
  });

  it('colours each orb with the light of the part of the picture nearest it', () => {
    const { container } = render(<AmbientOrbs videoRef={{ current: null }} />);

    expect(container.querySelector('span')).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
  });

  it('is left out of what a screen reader reads', () => {
    const { container } = render(<AmbientOrbs videoRef={{ current: null }} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AmbientOrbs.displayName).toBe('AmbientOrbs');
  });
});
