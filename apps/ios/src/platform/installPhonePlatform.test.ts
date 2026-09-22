import { forgetPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { installPhonePlatform } from './installPhonePlatform';
import { THE_SERVER_ADDRESS } from './THE_SERVER_ADDRESS';

const original = globalThis.fetch;

afterEach(() => {
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

  it('does not claim to keep files, since it cannot yet', () => {
    installPhonePlatform(new Map());

    expect(platformInUse().canKeepFiles()).toBe(false);
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
});
