import { render } from '@testing-library/react-native';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AirPlayButton } from './AirPlayButton';

jest.mock('@ValenceMobile/platform/hasLiquidGlass', () => ({
  hasLiquidGlass: jest.fn(() => false),
}));

beforeEach(() => {
  jest.mocked(hasLiquidGlass).mockReset().mockReturnValue(false);
});

const glassIn = () => theDrawnRoot().queryAll((node) => node.props.roundness === 20);

describe('AirPlayButton', () => {
  it('offers the phone’s own AirPlay picker, named for who cannot see it', async () => {
    const drawn = await render(<AirPlayButton />);

    expect(drawn.getByLabelText('Play on another device')).toBeTruthy();
  });

  it('draws its own mark over the system’s, leaving only the system’s press', async () => {
    const drawn = await render(<AirPlayButton isOverPicture />);

    expect(drawn.getByLabelText('Play on another device').props.colour).toBe('transparent');
  });

  it('sits on glass of its own on a phone that has liquid glass', async () => {
    jest.mocked(hasLiquidGlass).mockReturnValue(true);
    await render(<AirPlayButton />);

    expect(glassIn()).not.toHaveLength(0);
  });

  it('leaves the glass out where a circle is drawn around it, so there is one circle and not two', async () => {
    jest.mocked(hasLiquidGlass).mockReturnValue(true);
    const drawn = await render(<AirPlayButton isBare />);

    expect(glassIn()).toHaveLength(0);
    expect(drawn.getByLabelText('Play on another device')).toBeTruthy();
  });
});
