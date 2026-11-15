import { render, screen } from '@testing-library/react-native';
import { APaletteLayer } from './APaletteLayer';

const PALETTE = [
  { colour: '#ff0000', at: '10% 10%' },
  { colour: '#00ff00', at: '90% 10%' },
];

describe('APaletteLayer', () => {
  it('fades in as it arrives', async () => {
    await render(<APaletteLayer palette={PALETTE} isLeaving={false} />);

    expect(screen.root).toHaveStyle({ opacity: 0 });
  });

  it('is lit from the start where it was there when the background was drawn', async () => {
    await render(<APaletteLayer palette={PALETTE} isLeaving={false} isThereAlready />);

    expect(screen.root).toHaveStyle({ opacity: 1 });
  });

  it('draws every bloom as one background', async () => {
    await render(<APaletteLayer palette={PALETTE} isLeaving={false} />);

    expect(JSON.stringify(screen.root?.props.style)).toContain('radial-gradient');
  });

  it('is kept as one picture while it fades in', async () => {
    await render(<APaletteLayer palette={PALETTE} isLeaving={false} />);

    expect(screen.root?.props.renderToHardwareTextureAndroid).toBe(true);
  });

  it('is not kept as a picture where it was there from the start', async () => {
    await render(<APaletteLayer palette={PALETTE} isLeaving={false} isThereAlready />);

    expect(screen.root?.props.renderToHardwareTextureAndroid).toBe(false);
  });

  it('draws nothing where no light shines', async () => {
    await render(
      <APaletteLayer palette={[{ colour: '#808080', at: '10% 10%', weight: 0 }]} isLeaving />,
    );

    expect(JSON.stringify(screen.root?.props.style)).not.toContain('radial-gradient');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(APaletteLayer.displayName).toBe('APaletteLayer');
  });
});
