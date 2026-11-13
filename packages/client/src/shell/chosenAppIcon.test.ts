import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { APP_ICON_KEY } from './APP_ICON_KEY';
import { chosenAppIcon } from './chosenAppIcon';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('chosenAppIcon', () => {
  it('reads the icon chosen on this computer', () => {
    platformInUse().store.write(APP_ICON_KEY, 'light');

    expect(chosenAppIcon()).toBe('light');
  });
});
