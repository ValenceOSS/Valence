import { render } from '@testing-library/react-native';
import { useFollowTheTelevision } from '@ValenceClient/video/useFollowTheTelevision';
import { TheVideoFollower } from './TheVideoFollower';

jest.mock('@ValenceClient/video/useFollowTheTelevision', () => ({
  useFollowTheTelevision: jest.fn(),
}));

describe('TheVideoFollower', () => {
  it('follows a television while the phone shows no film of its own', async () => {
    await render(<TheVideoFollower isBusy={false} />);

    expect(useFollowTheTelevision).toHaveBeenLastCalledWith(false);
  });

  it('says so while the phone is showing a film of its own', async () => {
    await render(<TheVideoFollower isBusy />);

    expect(useFollowTheTelevision).toHaveBeenLastCalledWith(true);
  });

  it('draws nothing', async () => {
    const drawn = await render(<TheVideoFollower isBusy={false} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
