import { act, render } from '@testing-library/react-native';
import { ArrivalBanner } from '@ValenceTv/components/ArrivalBanner/ArrivalBanner';
import type { Notification } from '@ValenceContracts/schemas/Notification';

type MockRemoteEvent = { eventType: string };

const mockListeners = new Set<(event: MockRemoteEvent) => void>();

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (listener: (event: MockRemoteEvent) => void) => {
      mockListeners.add(listener);

      return {
        remove: () => {
          mockListeners.delete(listener);
        },
      };
    },
  },
}));

const ARRIVAL: Notification = {
  id: '00000000-0000-4000-8000-000000000001',
  event: 'requests.available',
  title: 'Arrival is ready to watch',
  body: 'The film you asked for has arrived.',
  link: '/media/00000000-0000-4000-8000-000000000002',
  createdAt: '2026-09-23T00:00:00.000Z',
  readAt: null,
};

const press = async (eventType: string) => {
  await act(() => {
    mockListeners.forEach((listener) => {
      listener({ eventType });
    });
  });
};

describe('ArrivalBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('says what has arrived and how to watch it', async () => {
    const drawn = await render(
      <ArrivalBanner arrival={ARRIVAL} picture={null} onWatch={jest.fn()} onDismiss={jest.fn()} />,
    );

    expect(drawn.getByText('Arrival is ready to watch')).toBeTruthy();
    expect(drawn.getByText('Press')).toBeTruthy();
    expect(drawn.getByText('to watch')).toBeTruthy();
  });

  it('never takes the remote from wherever it is', async () => {
    const drawn = await render(
      <ArrivalBanner arrival={ARRIVAL} picture={null} onWatch={jest.fn()} onDismiss={jest.fn()} />,
    );

    expect(drawn.toJSON()).toHaveProp('pointerEvents', 'none');
    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('slides away by itself after a few seconds', async () => {
    const onDismiss = jest.fn();

    await render(
      <ArrivalBanner arrival={ARRIVAL} picture={null} onWatch={jest.fn()} onDismiss={onDismiss} />,
    );

    await act(() => {
      jest.advanceTimersByTime(9000);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('opens the title when Play/Pause is pressed while it shows', async () => {
    const onWatch = jest.fn();
    const onDismiss = jest.fn();

    await render(
      <ArrivalBanner arrival={ARRIVAL} picture={null} onWatch={onWatch} onDismiss={onDismiss} />,
    );

    await press('playPause');

    expect(onWatch).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores any other press of the remote', async () => {
    const onWatch = jest.fn();

    await render(
      <ArrivalBanner arrival={ARRIVAL} picture={null} onWatch={onWatch} onDismiss={jest.fn()} />,
    );

    await press('select');

    expect(onWatch).not.toHaveBeenCalled();
  });
});
