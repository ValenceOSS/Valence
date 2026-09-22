import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetTheFakePlayer } from '@ValencePhone/testing/theFakePlayer';

beforeEach(() => {
  installPlatform(aFakePlatform());
  forgetTheFakePlayer();
});

afterEach(() => {
  forgetPlatform();
});
