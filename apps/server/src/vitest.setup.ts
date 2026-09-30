import { expect } from 'vitest';
import { saidMatchesItsEnglish } from '@ValenceI18n/testing/saidMatchesItsEnglish';

expect.addEqualityTesters([saidMatchesItsEnglish]);
