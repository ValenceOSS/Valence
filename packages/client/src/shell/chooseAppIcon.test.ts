import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformInUse,
} from '@ValenceClient/platform/installPlatform';
import { APP_ICON_KEY } from './APP_ICON_KEY';
import { chooseAppIcon } from './chooseAppIcon';
import { chosenAppIcon } from './chosenAppIcon';

beforeEach(() => {
  installPlatform(aStillPlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('chooseAppIcon', () => {
  it('keeps a light or dark icon, and forgets the choice to follow the system', () => {
    expect(chosenAppIcon()).toBe('system');

    chooseAppIcon('dark');

    expect(chosenAppIcon()).toBe('dark');

    chooseAppIcon('system');

    expect(platformInUse().store.read(APP_ICON_KEY)).toBeNull();
    expect(chosenAppIcon()).toBe('system');
  });

  it('follows the system where what was kept no longer reads', () => {
    platformInUse().store.write(APP_ICON_KEY, 'purple');

    expect(chosenAppIcon()).toBe('system');
  });
});
