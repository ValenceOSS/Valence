import { render } from '@testing-library/react-native';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { aProfile } from '@ValenceMobile/testing/aProfile';
import { AWayInLights } from './AWayInLights';

jest.mock('@ValenceMobile/hooks/usePictureLights', () => ({ usePictureLights: jest.fn(() => []) }));
jest.mock('@ValenceMobile/components/AMoodBackground/AMoodBackground', () => ({
  AMoodBackground: jest.fn(() => null),
}));

const drawn = () => jest.mocked(AMoodBackground).mock.calls.at(-1)?.[0];

beforeEach(() => {
  jest.mocked(AMoodBackground).mockClear();
  jest.mocked(usePictureLights).mockReturnValue([]);
});

describe('AWayInLights', () => {
  it('lights the house colours while nobody is picked', async () => {
    await render(<AWayInLights profile={null} />);

    expect(drawn()).toEqual({ lights: [] });
  });

  it('lights the colour of whoever is picked, where their picture gives none', async () => {
    await render(<AWayInLights profile={aProfile({ colour: '#33aa55' })} />);

    expect(drawn()).toEqual({ lights: ['#33aa55'] });
  });

  it('lights the colours read from their picture, where it gives some', async () => {
    const palette = [{ colour: '#123456', at: '10% 10%' }];

    jest.mocked(usePictureLights).mockReturnValue(palette);

    await render(<AWayInLights profile={aProfile()} />);

    expect(drawn()).toEqual({ palette });
  });
});
