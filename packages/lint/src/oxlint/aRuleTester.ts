import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

/**
 * A rule tester that reads TypeScript and JSX and reports through Vitest, so each case of a rule
 * is a test of its own.
 *
 * @returns The tester.
 */
const aRuleTester = (): RuleTester => {
  RuleTester.describe = describe;
  RuleTester.it = it;
  RuleTester.itOnly = it.only;

  return new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
};

export { aRuleTester };
