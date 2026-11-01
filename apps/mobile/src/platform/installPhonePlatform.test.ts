import { DEVICE_HEADER } from '@ValenceContracts/constants/DEVICE_HEADER';
import { readDeviceHints } from '@ValenceContracts/functions/readDeviceHints';
import { forgetPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { installPhonePlatform } from './installPhonePlatform';
import { THE_SERVER_ADDRESS } from './THE_SERVER_ADDRESS';

jest.mock('@ValenceClient/downloads/theKeptListening', () => ({
  theKeptListening: jest.fn(),
}));

const original = globalThis.fetch;

afterEach(() => {
  jest.useRealTimers();
  forgetPlatform();
  globalThis.fetch = original;
});

describe('installPhonePlatform', () => {
  it('tells the application it is running on a phone', () => {
    installPhonePlatform(new Map());

    expect(platformInUse().thisClientKind()).toBe('phone');
  });

  it('says where the server is, from what the phone remembered', () => {
    installPhonePlatform(new Map([[THE_SERVER_ADDRESS, 'http://192.168.1.36:8420']]));

    expect(platformInUse().serverAddress()).toBe('http://192.168.1.36:8420');
  });

  it('says nothing about a server nobody has named', () => {
    installPhonePlatform(new Map());

    expect(platformInUse().serverAddress()).toBeNull();
  });

  it('keeps files, since a phone can download a film to watch without the server', () => {
    installPhonePlatform(new Map());

    expect(platformInUse().canKeepFiles()).toBe(true);
  });

  it('keeps music and audiobooks in a folder of their own', () => {
    installPhonePlatform(new Map());

    expect(platformInUse().listeningFiles.addressOf('track-t1-high.m4a')).toMatch(
      /listening\/track-t1-high\.m4a$/u,
    );
  });

  it('picks up the music and audiobooks left downloading a few seconds after it starts', () => {
    jest.useFakeTimers();
    jest.mocked(theKeptListening).mockClear();
    installPhonePlatform(new Map());

    expect(theKeptListening).not.toHaveBeenCalled();

    jest.advanceTimersByTime(3000);

    expect(theKeptListening).toHaveBeenCalled();
  });

  it('names the phone as its owner named it', () => {
    installPhonePlatform(new Map());

    expect(platformInUse().describeThisClient()).toBe("Dan's iPhone");
  });

  it('gives the phone an origin, so a path reaches the server', async () => {
    const asked: string[] = [];

    globalThis.fetch = (input: string | Request | URL): Promise<Response> => {
      asked.push(input instanceof Request ? input.url : String(input));

      return Promise.resolve(new Response('{}'));
    };

    installPhonePlatform(new Map([[THE_SERVER_ADDRESS, 'http://192.168.1.36:8420']]));

    await globalThis.fetch('/api/health');

    expect(asked[0]).toBe('http://192.168.1.36:8420/api/health');
  });

  it('describes the phone it runs on, as its system describes it', () => {
    installPhonePlatform(new Map());

    expect(platformInUse().describeThisDevice()).toMatchObject({
      app: 'phone',
      system: 'ios',
      form: 'phone',
      name: "Dan's iPhone",
    });
  });

  it('tells the server which device each request comes from', async () => {
    const sent: (string | null)[] = [];

    globalThis.fetch = (_input: string | Request | URL, init?: RequestInit): Promise<Response> => {
      sent.push(new Headers(init?.headers).get(DEVICE_HEADER));

      return Promise.resolve(new Response('{}'));
    };

    installPhonePlatform(new Map([[THE_SERVER_ADDRESS, 'http://192.168.1.36:8420']]));

    await globalThis.fetch('/api/health');

    expect(readDeviceHints(sent[0])).toMatchObject({ app: 'phone', name: "Dan's iPhone" });
    expect(readDeviceHints(sent[0]).id).toBeDefined();
  });
});
