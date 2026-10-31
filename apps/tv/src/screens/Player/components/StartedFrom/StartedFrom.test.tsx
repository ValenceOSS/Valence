import { act, render } from '@testing-library/react-native';
import { StartedFrom } from '@ValenceTv/screens/Player/components/StartedFrom/StartedFrom';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('StartedFrom', () => {
  it('says which device started the film', async () => {
    const drawn = await render(<StartedFrom label="Dan’s iPhone" />);

    expect(drawn.getByText('Started from Dan’s iPhone')).toBeTruthy();
  });

  it('goes away by itself once it has been read', async () => {
    const drawn = await render(<StartedFrom label="Dan’s iPhone" />);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(drawn.queryByText('Started from Dan’s iPhone')).toBeNull();
  });
});
