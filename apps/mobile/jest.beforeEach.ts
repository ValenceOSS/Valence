import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetTheFakePlayer } from '@ValenceMobile/testing/theFakePlayer';
import { View } from 'react-native';

const NOT_YET_LAID_OUT = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };

if ('prototype' in View && typeof View.prototype === 'object') {
  Object.assign(View.prototype, {
    getBoundingClientRect: () => NOT_YET_LAID_OUT,
    measureInWindow: (told: (x: number, y: number, width: number, height: number) => void) => {
      told(0, 0, 0, 0);
    },
  });
}

beforeEach(() => {
  installPlatform(aFakePlatform());
  forgetTheFakePlayer();
});

afterEach(() => {
  forgetPlatform();
});
