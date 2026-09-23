import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { onTheServer, theServersOrigin } from '@ValenceTv/platform/theServersOrigin';

describe('theServersOrigin', () => {
  it('is nothing before the television has been told', () => {
    expect(theServersOrigin()).toBeNull();
  });

  it('is the server the television was told to watch', () => {
    rememberServerAddress('http://valence.local:3000');

    expect(theServersOrigin()).toBe('http://valence.local:3000');
  });
});

describe('onTheServer', () => {
  it('puts a path on the server', () => {
    rememberServerAddress('http://valence.local:3000');

    expect(onTheServer('/api/media/1/image/poster')).toBe(
      'http://valence.local:3000/api/media/1/image/poster',
    );
  });

  it('leaves a full address where it is', () => {
    rememberServerAddress('http://valence.local:3000');

    expect(onTheServer('https://image.tmdb.org/a.jpg')).toBe('https://image.tmdb.org/a.jpg');
  });

  it('leaves a path as it is where there is no server yet', () => {
    expect(onTheServer('/api/x')).toBe('/api/x');
  });
});
