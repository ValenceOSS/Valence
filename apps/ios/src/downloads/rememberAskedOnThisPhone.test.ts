import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { askedOnThisPhone } from './askedOnThisPhone';
import { rememberAskedOnThisPhone } from './rememberAskedOnThisPhone';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('rememberAskedOnThisPhone', () => {
  it('keeps one of each, however often it is told', () => {
    rememberAskedOnThisPhone('one', true);
    rememberAskedOnThisPhone('one', true);

    expect(askedOnThisPhone()).toEqual(['one']);
  });

  it('remembers what is still waiting, and forgets what has arrived', () => {
    rememberAskedOnThisPhone('one', true);
    rememberAskedOnThisPhone('two', true);
    rememberAskedOnThisPhone('one', false);

    expect(askedOnThisPhone()).toEqual(['two']);
  });
});
