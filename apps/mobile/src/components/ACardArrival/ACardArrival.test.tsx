import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ACardArrival } from './ACardArrival';

describe('ACardArrival', () => {
  it('draws what is arriving', async () => {
    const drawn = await render(
      <ACardArrival at={0}>
        <Text>Arrival</Text>
      </ACardArrival>,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('starts out of sight, and says it has started arriving', async () => {
    const onArrived = jest.fn();

    await render(
      <ACardArrival at={2} onArrived={onArrived}>
        <Text>Arrival</Text>
      </ACardArrival>,
    );

    expect(theDrawnRoot()).toHaveStyle({ opacity: 0 });
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it('is simply there where it had arrived before, and starts nothing', async () => {
    const onArrived = jest.fn();

    await render(
      <ACardArrival at={2} isArrived onArrived={onArrived}>
        <Text>Arrival</Text>
      </ACardArrival>,
    );

    expect(theDrawnRoot()).toHaveStyle({ opacity: 1 });
    expect(onArrived).not.toHaveBeenCalled();
  });

  it('goes on arriving where it is remembered as seen part way, rather than starting again', async () => {
    const onArrived = jest.fn();
    const drawn = await render(
      <ACardArrival at={1} onArrived={onArrived}>
        <Text>Arrival</Text>
      </ACardArrival>,
    );

    await drawn.rerender(
      <ACardArrival at={1} isArrived onArrived={onArrived}>
        <Text>Arrival</Text>
      </ACardArrival>,
    );

    expect(theDrawnRoot()).toHaveStyle({ opacity: 0 });
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ACardArrival.displayName).toBe('ACardArrival');
  });
});
