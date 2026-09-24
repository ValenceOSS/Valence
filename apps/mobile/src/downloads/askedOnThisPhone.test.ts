import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { askedOnThisPhone } from './askedOnThisPhone';
import { rememberAskedOnThisPhone } from './rememberAskedOnThisPhone';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('askedOnThisPhone', () => {
  it('knows of nothing before this phone has asked for anything', () => {
    expect(askedOnThisPhone()).toEqual([]);
  });

  it('remembers what is still waiting, and forgets what has arrived', () => {
    rememberAskedOnThisPhone('one', true);
    rememberAskedOnThisPhone('two', true);
    rememberAskedOnThisPhone('one', false);

    expect(askedOnThisPhone()).toEqual(['two']);
  });
});
