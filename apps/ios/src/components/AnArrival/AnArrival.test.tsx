import { render } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import { ARRIVING } from '@ValencePhone/components/AnArrival/ARRIVING';
import { AnArrival } from './AnArrival';

describe('AnArrival', () => {
  it('simply draws what it holds outside a library', async () => {
    const drawn = await render(
      <AnArrival>
        <Text>Arrival</Text>
      </AnArrival>,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('draws what it holds in full once it has arrived', async () => {
    const drawn = await render(
      <ARRIVING.Provider value={new Animated.Value(0)}>
        <AnArrival>
          <Text>Arrival</Text>
        </AnArrival>
      </ARRIVING.Provider>,
    );

    expect(JSON.stringify(drawn.toJSON())).toContain('"opacity":1');
  });

  it('starts from the side it was chosen from, unseen', async () => {
    const drawn = await render(
      <ARRIVING.Provider value={new Animated.Value(1)}>
        <AnArrival>
          <Text>Arrival</Text>
        </AnArrival>
      </ARRIVING.Provider>,
    );

    expect(JSON.stringify(drawn.toJSON())).toContain('"translateX":40');
    expect(JSON.stringify(drawn.toJSON())).toContain('"opacity":0');
  });
});
