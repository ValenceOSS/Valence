import { theTvsReach } from '@ValenceTv/platform/theTvsReach';

type Heard = (state: { isConnected: boolean | null }) => void;

const mockTold: Heard[] = [];

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (listener: Heard) => {
      mockTold.push(listener);

      return () => undefined;
    },
  },
}));

const theNetwork = (isConnected: boolean | null): void => {
  for (const listener of mockTold) {
    listener({ isConnected });
  }
};

beforeEach(() => {
  mockTold.length = 0;
});

describe('theTvsReach', () => {
  it('starts out reachable', () => {
    expect(theTvsReach().isReachable()).toBe(true);
  });

  it('follows the system as the network comes and goes', () => {
    const reach = theTvsReach();

    theNetwork(false);

    expect(reach.isReachable()).toBe(false);

    theNetwork(true);

    expect(reach.isReachable()).toBe(true);
  });

  it('takes a network the system is unsure of as reachable', () => {
    const reach = theTvsReach();

    theNetwork(false);
    theNetwork(null);

    expect(reach.isReachable()).toBe(true);
  });

  it('tells a listener each time the network changes', () => {
    const heard = jest.fn();

    theTvsReach().whenChanged(heard);
    theNetwork(false);

    expect(heard).toHaveBeenCalledWith(false);
  });
});
