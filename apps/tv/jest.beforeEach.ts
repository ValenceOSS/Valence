import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';

beforeEach(() => {
  installPlatform(aFakePlatform({ thisClientKind: () => 'tv' }));
});

afterEach(() => {
  forgetPlatform();
});
