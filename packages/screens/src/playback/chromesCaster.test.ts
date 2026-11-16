import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as CastSenderModule from '@ValenceScreens/playback/castSender';
import { chromesCaster } from './chromesCaster';
import type {
  CastCarrier,
  CastConnectionState,
  CastContext,
  CastRemotePlayer,
  CastSession,
} from './castSender.types';

const castStreamMock = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));

const followMock = vi.hoisted(() => vi.fn(() => () => undefined));

vi.mock('@ValenceScreens/playback/castSender', async () => ({
  ...(await vi.importActual<typeof CastSenderModule>('@ValenceScreens/playback/castSender')),
  castStream: castStreamMock,
}));

vi.mock('@ValenceScreens/playback/followCastPosition', () => ({
  followCastPosition: followMock,
}));

const players: CastRemotePlayer[] = [];

const controller = { playOrPause: vi.fn(), seek: vi.fn(), setVolumeLevel: vi.fn() };

/**
 * A Cast SDK as Chrome loads it, connected or not, with a remote player a test can look at.
 *
 * @param state - Where the SDK says casting stands.
 * @param session - The session it holds, where it holds one.
 * @returns The context, and the carrier it was loaded onto.
 */
const anSdk = (
  state: CastConnectionState = 'NOT_CONNECTED',
  session: CastSession | null = null,
) => {
  const context: CastContext = {
    setOptions: vi.fn(),
    requestSession: vi.fn(() => Promise.resolve()),
    getCurrentSession: () => session,
    getCastState: () => state,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const carrier: CastCarrier = {
    cast: {
      framework: {
        CastContext: { getInstance: () => context },
        CastContextEventType: { CAST_STATE_CHANGED: 'caststatechanged' },
        RemotePlayer: class {
          isConnected = true;
          isMediaLoaded = true;
          currentTime = 0;

          constructor() {
            players.push(this);
          }
        },
        RemotePlayerController: class {
          addEventListener = vi.fn();
          removeEventListener = vi.fn();
          playOrPause = controller.playOrPause;
          seek = controller.seek;
          setVolumeLevel = controller.setVolumeLevel;
        },
      },
    },
  };

  return { context, carrier };
};

beforeEach(() => {
  players.length = 0;
  castStreamMock.mockClear();
  followMock.mockClear();
  controller.playOrPause.mockClear();
  controller.seek.mockClear();
  controller.setVolumeLevel.mockClear();
});

describe('chromesCaster', () => {
  it('says where casting stands as the SDK says it, and draws no list of its own', () => {
    const { context, carrier } = anSdk('CONNECTED');
    const heard = vi.fn();

    chromesCaster(context, carrier).watch(heard);

    expect(heard).toHaveBeenCalledWith({ state: 'connected', devices: null, deviceId: null });
  });

  it('hears each change the SDK says, until told to stop', () => {
    const { context, carrier } = anSdk('CONNECTING');
    const stop = chromesCaster(context, carrier).watch(vi.fn());

    expect(context.addEventListener).toHaveBeenCalledWith('caststatechanged', expect.any(Function));

    stop();

    expect(context.removeEventListener).toHaveBeenCalledWith(
      'caststatechanged',
      expect.any(Function),
    );
  });

  it('asks the SDK to show its own list of devices', () => {
    const { context, carrier } = anSdk();

    chromesCaster(context, carrier).choose();

    expect(context.requestSession).toHaveBeenCalled();
  });

  it('casts only from an address something else on the network could reach', () => {
    const { context, carrier } = anSdk();
    const caster = chromesCaster(context, carrier);

    expect(caster.canReach('http://localhost:8420')).toBe(false);
    expect(caster.canReach('http://192.168.1.20:8420')).toBe(true);
  });

  it('hands the SDK the stream as a whole address on this server', async () => {
    const { context, carrier } = anSdk('CONNECTED');
    const caster = chromesCaster(context, carrier, () => 'http://192.168.1.20:8420');

    await expect(
      caster.load({
        address: '/api/playback/cast/t/master.m3u8',
        title: 'Arrival',
        startSeconds: 9,
      }),
    ).resolves.toBe(true);
    expect(castStreamMock).toHaveBeenCalledWith(context, {
      url: 'http://192.168.1.20:8420/api/playback/cast/t/master.m3u8',
      title: 'Arrival',
      startSeconds: 9,
    });
  });

  it('hands nothing over from an address only this machine can reach', async () => {
    const { context, carrier } = anSdk('CONNECTED');
    const caster = chromesCaster(context, carrier, () => 'http://localhost:8420');

    await expect(
      caster.load({
        address: '/api/playback/cast/t/master.m3u8',
        title: 'Arrival',
        startSeconds: 9,
      }),
    ).resolves.toBe(false);
    expect(castStreamMock).not.toHaveBeenCalled();
  });

  it('makes a stream whole on this page’s own address', async () => {
    const { context, carrier } = anSdk();

    await expect(
      chromesCaster(context, carrier, () => 'http://192.168.1.20:8420').reachableAddress('/a.m3u8'),
    ).resolves.toBe('http://192.168.1.20:8420/a.m3u8');
  });

  it('follows the device through the SDK’s remote player', () => {
    const { context, carrier } = anSdk('CONNECTED');
    const seconds = vi.fn();
    const playing = vi.fn();

    chromesCaster(context, carrier).follow(seconds, playing);

    expect(followMock).toHaveBeenCalledWith(seconds, carrier, playing);
  });

  it('drives the device through the SDK’s remote player', () => {
    const { context, carrier } = anSdk('CONNECTED');
    const caster = chromesCaster(context, carrier);

    caster.playOrPause();
    caster.seek(120);
    caster.setVolume(0.5);

    expect(controller.playOrPause).toHaveBeenCalled();
    expect(players).toHaveLength(1);
    expect(players[0]?.currentTime).toBe(120);
    expect(controller.seek).toHaveBeenCalled();
    expect(players[0]?.volumeLevel).toBe(0.5);
    expect(controller.setVolumeLevel).toHaveBeenCalled();
  });

  it('names the device and ends the session through the SDK', () => {
    const endSession = vi.fn();
    const { context, carrier } = anSdk('CONNECTED', {
      loadMedia: vi.fn(),
      endSession,
      getCastDevice: () => ({ friendlyName: 'Living Room TV' }),
    });
    const caster = chromesCaster(context, carrier);

    caster.stop();

    expect(caster.deviceName()).toBe('Living Room TV');
    expect(endSession).toHaveBeenCalledWith(true);
  });

  it('chooses no device by name, since the SDK chooses through its own list', async () => {
    const { context, carrier } = anSdk();

    await expect(chromesCaster(context, carrier).castTo('living-room')).resolves.toBe(false);
  });
});
