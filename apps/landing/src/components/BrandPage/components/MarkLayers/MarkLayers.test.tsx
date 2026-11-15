import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkLayers } from './MarkLayers';

describe('MarkLayers', () => {
  it('draws all three layers and dims every one but the layer it is about', () => {
    const { container } = render(<MarkLayers lit="middle" />);
    const layers = [...(container.firstElementChild?.children ?? [])];

    expect(layers).toHaveLength(3);
    expect(layers.filter((layer) => layer.classList.contains('opacity-20'))).toHaveLength(2);
  });

  it('is decoration, hidden from assistive technology', () => {
    const { container } = render(<MarkLayers lit="top" />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MarkLayers.displayName).toBe('MarkLayers');
  });
});
