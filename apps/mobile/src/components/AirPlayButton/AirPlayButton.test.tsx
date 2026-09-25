import { render } from '@testing-library/react-native';
import { AirPlayButton } from './AirPlayButton';

describe('AirPlayButton', () => {
  it('offers the phone’s own AirPlay picker, named for who cannot see it', async () => {
    const drawn = await render(<AirPlayButton />);

    expect(drawn.getByLabelText('Play on another device')).toBeTruthy();
  });

  it('is white over a film, whatever the theme', async () => {
    const drawn = await render(<AirPlayButton isOverPicture />);

    expect(drawn.getByLabelText('Play on another device').props.colour).toBe('#ffffff');
  });
});
