import { afterEach, describe, expect, it } from 'vitest';
import { signedInOnThisPage } from '@ValenceScreens/phone/signedInOnThisPage';

afterEach(() => {
  signedInOnThisPage.forget();
});

describe('signedInOnThisPage', () => {
  it('remembers only that somebody signed in since the page loaded, until forgotten', () => {
    expect(signedInOnThisPage.read()).toBe(false);

    signedInOnThisPage.mark();

    expect(signedInOnThisPage.read()).toBe(true);

    signedInOnThisPage.forget();

    expect(signedInOnThisPage.read()).toBe(false);
  });
});
