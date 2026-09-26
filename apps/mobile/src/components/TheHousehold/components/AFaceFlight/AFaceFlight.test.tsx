import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { AFaceFlight } from './AFaceFlight';
import { aProfile } from '@ValenceMobile/testing/aProfile';

const somebody = aProfile({ name: 'Marques', avatar: { kind: 'initial', font: 'gilroy' } });

const FROM = { x: 120, y: 300, width: 136, height: 136 };

describe('AFaceFlight', () => {
  beforeEach(() => {
    installPlatform(aFakePlatform());
  });

  it('carries their face, as their initial where they have no picture', async () => {
    const drawn = await render(
      <AFaceFlight profile={somebody} from={FROM} to={null} onLanded={jest.fn()} />,
    );

    expect(drawn.getByText('M')).toBeTruthy();
  });

  it('gives up and says so where the tab never says where it is', async () => {
    jest.useFakeTimers();
    const onLanded = jest.fn();

    await render(<AFaceFlight profile={somebody} from={FROM} to={null} onLanded={onLanded} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(4500);
    });

    expect(onLanded).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
