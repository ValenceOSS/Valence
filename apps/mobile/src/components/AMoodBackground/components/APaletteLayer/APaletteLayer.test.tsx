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
});
