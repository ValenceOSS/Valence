import { render, userEvent } from '@testing-library/react-native';
import { DiscoverPointer } from './DiscoverPointer';

describe('DiscoverPointer', () => {
  it('says how many Discover has and opens them', async () => {
    const onDiscover = jest.fn();
    const drawn = await render(
      <DiscoverPointer
        asked="dune"
        count={3}
        isAlone={false}
        hasPreferredFocus={false}
        onDiscover={onDiscover}
      />,
    );

    expect(drawn.getByText('Can’t find what you’re looking for?')).toBeTruthy();
    expect(drawn.getByText('Discover has 3 results for “dune” that you can request.')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'See 3 results in Discover' }));

    expect(onDiscover).toHaveBeenCalled();
  });

  it('says nothing on the server matches where the library found nothing', async () => {
    const drawn = await render(
      <DiscoverPointer
        asked="dune"
        count={1}
        isAlone
        hasPreferredFocus={false}
        onDiscover={jest.fn()}
      />,
    );

    expect(drawn.getByText('Nothing on this server matches “dune”')).toBeTruthy();
  });
});
