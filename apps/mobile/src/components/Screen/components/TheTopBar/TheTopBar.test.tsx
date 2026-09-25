import { Animated } from 'react-native';
import { render } from '@testing-library/react-native';
import { TheTopBar } from './TheTopBar';

describe('TheTopBar', () => {
  it('names the page once it has scrolled past its head', async () => {
    const drawn = await render(
      <TheTopBar title="Arrival" scrolled={new Animated.Value(200)} from={100} isPast />,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('names nothing on a page with no name to give', async () => {
    const drawn = await render(
      <TheTopBar scrolled={new Animated.Value(0)} from={100} isPast={false} />,
    );

    expect(drawn.queryByText('Arrival')).toBeNull();
  });
});
