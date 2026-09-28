import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { pictureOnThisServer } from './pictureOnThisServer';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

describe('pictureOnThisServer', () => {
  it('puts a picture the server keeps on the server this phone watches', () => {
    expect(pictureOnThisServer('/api/music/pictures/one')).toBe(
      'http://192.168.1.36:8420/api/music/pictures/one',
    );
  });

  it('reads a picture elsewhere on the web where it is', () => {
    expect(pictureOnThisServer('https://images.example/cover.jpg')).toBe(
      'https://images.example/cover.jpg',
    );
  });
});
