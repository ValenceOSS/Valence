import { aRuleTester } from './aRuleTester';
import { logicalSides } from './logicalSides';

const ruleTester = aRuleTester();

ruleTester.run('logical-sides', logicalSides, {
  valid: [
    { code: "const it = 'ms-2 pe-4 start-0 text-start rounded-s-lg border-e';" },
    { code: "const it = 'absolute left-1/2 -translate-x-1/2';" },
    { code: "const it = 'inset-x-0 mx-auto px-3';" },
    { code: "const it = 'Reads left-to-right';" },
    { code: "const it = 'html-ready';" },
    { filename: 'a/b/Thing.test.tsx', code: "const it = 'ml-2';" },
  ],
  invalid: [
    { code: "const it = 'ml-2';", errors: [{ messageId: 'physical' }] },
    { code: "const it = 'hover:pr-4';", errors: [{ messageId: 'physical' }] },
    { code: "const it = 'absolute -right-1 top-0';", errors: [{ messageId: 'physical' }] },
    { code: "const it = 'text-left';", errors: [{ messageId: 'physical' }] },
    { code: "const it = 'rounded-l-lg';", errors: [{ messageId: 'physical' }] },
    { code: "const it = 'rounded-tr-md';", errors: [{ messageId: 'physical' }] },
    { code: "const it = 'border-l-2';", errors: [{ messageId: 'physical' }] },
    { code: 'const it = `flex ${gap} pl-[3px]`;', errors: [{ messageId: 'physical' }] },
  ],
});
